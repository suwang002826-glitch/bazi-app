# Preview package 019f0ea7-042b-7940-8b41-718c78aee1ec

Open this folder with WeChat DevTools as a miniprogram project.

Backend switch:

- File: `app.js`
- Config: `globalData.baziApi`
- Set `enabled: true`
- Set `baseUrl` to the backend host
- Default API path is `/bazi/calculate`

Current package default keeps `enabled: false`, so it can still run with the local preview engine when the backend host is not configured.
