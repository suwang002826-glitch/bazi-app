const solarTermManifest = require('../../data-packs/solar-terms/manifest.json');
const hkoSolarTerms2024To2026 = require('../../data-packs/solar-terms/candidates/hko-solar-terms-2024-2026-candidate.json');

const defaultPackModules = {
  'candidates/hko-solar-terms-2024-2026-candidate.json': hkoSolarTerms2024To2026
};

function isApprovedPack(manifest, packEntry, dataPack) {
  return manifest.runtimeEnabled === true
    && packEntry.runtimeEnabled === true
    && packEntry.status === 'approved-for-runtime'
    && Array.isArray(manifest.runtimeEnabledPackIds)
    && manifest.runtimeEnabledPackIds.includes(packEntry.id)
    && dataPack.status === 'approved-for-runtime'
    && dataPack.runtimeApproval
    && dataPack.runtimeApproval.status === 'approved-for-runtime';
}

function loadSolarTermDataPacks(manifest = solarTermManifest, options = {}) {
  const packModules = options.packModules || defaultPackModules;
  const packs = Array.isArray(manifest.packs) ? manifest.packs : [];

  return packs.reduce((approvedPacks, packEntry) => {
    if (packEntry.runtimeEnabled !== true) {
      return approvedPacks;
    }

    const dataPack = packModules[packEntry.path];
    if (!dataPack) {
      const error = new Error(`Solar-term data-pack file is not registered: ${packEntry.path}`);
      error.code = 'SOLAR_TERM_DATA_PACK_NOT_REGISTERED';
      error.details = {
        dataPackId: packEntry.id,
        path: packEntry.path,
        calendarDataVersion: manifest.calendarDataVersion
      };
      throw error;
    }

    if (!isApprovedPack(manifest, packEntry, dataPack)) {
      return approvedPacks;
    }

    approvedPacks.push({
      ...dataPack,
      manifestEntry: packEntry
    });
    return approvedPacks;
  }, []);
}

function parseLocalMinute(localMinute) {
  const match = String(localMinute || '').match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function findTermMeta(dataPack, termKey) {
  return (dataPack.termOrder || []).find((term) => term.key === termKey) || null;
}

function findSolarTermRecord(query = {}, manifest = solarTermManifest, options = {}) {
  const year = Number(query.year);
  const termKey = String(query.termKey || '').trim();
  if (!Number.isInteger(year) || !termKey) {
    return null;
  }

  const dataPacks = loadSolarTermDataPacks(manifest, options);
  for (const dataPack of dataPacks) {
    const term = (dataPack.years && dataPack.years[String(year)] || []).find((item) => item.key === termKey);
    if (!term) {
      continue;
    }

    const date = parseLocalMinute(term.local);
    if (!date) {
      continue;
    }

    return {
      ...term,
      date,
      term: findTermMeta(dataPack, termKey),
      dataPackId: dataPack.id,
      calendarDataVersion: manifest.calendarDataVersion,
      provider: dataPack.authority && dataPack.authority.institution,
      precision: dataPack.precision,
      timezone: dataPack.timezone,
      runtimeApproval: dataPack.runtimeApproval
    };
  }

  return null;
}

function getSolarTermDataPackCoverage(manifest = solarTermManifest, options = {}) {
  const approvedPacks = loadSolarTermDataPacks(manifest, options);
  const years = Array.from(new Set(
    approvedPacks.flatMap((pack) => pack.manifestEntry.coveredYears || [])
  )).sort((left, right) => left - right);

  return {
    calendarDataVersion: manifest.calendarDataVersion,
    status: manifest.status,
    primaryAuthority: manifest.primaryAuthority,
    runtimeEnabled: approvedPacks.length > 0,
    packIds: approvedPacks.map((pack) => pack.id),
    years,
    warnings: manifest.warnings || manifest.blockers || []
  };
}

module.exports = {
  findSolarTermRecord,
  getSolarTermDataPackCoverage,
  loadSolarTermDataPacks
};
