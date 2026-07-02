const http = require('http');
const { calculateBazi, toErrorBody } = require('./baziService');

function sendJson(response, statusCode, body) {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  });
  response.end(payload);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        const error = new Error('请求体过大');
        error.code = 'REQUEST_BODY_TOO_LARGE';
        error.statusCode = 413;
        reject(error);
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        error.code = 'INVALID_JSON';
        error.statusCode = 400;
        error.message = '请求 JSON 格式不正确';
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function createBaziServer() {
  return http.createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {});
      return;
    }

    if (request.url === '/health') {
      if (request.method !== 'GET') {
        sendJson(response, 405, {
          code: 'METHOD_NOT_ALLOWED',
          message: '请使用 GET /health'
        });
        return;
      }
      sendJson(response, 200, {
        ok: true,
        service: 'bazi-backend',
        version: 'bazi-backend@0.1.0'
      });
      return;
    }

    if (request.url !== '/bazi/calculate') {
      sendJson(response, 404, {
        code: 'NOT_FOUND',
        message: '接口不存在'
      });
      return;
    }

    if (request.method !== 'POST') {
      sendJson(response, 405, {
        code: 'METHOD_NOT_ALLOWED',
        message: '请使用 POST /bazi/calculate'
      });
      return;
    }

    try {
      const body = await readJsonBody(request);
      sendJson(response, 200, calculateBazi(body));
    } catch (error) {
      sendJson(response, error.statusCode || 500, toErrorBody(error));
    }
  });
}

function startServer(options = {}) {
  const port = Number(process.env.PORT || options.port || 8787);
  const host = process.env.HOST || options.host || '127.0.0.1';
  const server = createBaziServer();
  server.listen(port, host, () => {
    console.log(`Bazi backend listening on http://${host}:${port}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createBaziServer,
  startServer
};
