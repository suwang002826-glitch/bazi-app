const baziRuleConfig = {
  ruleProfileVersion: 'bazi-rule-profile@v0.1',
  algorithmVersion: 'bazi-local-engine@0.1.0',
  calendarDataVersion: 'lunar-data-pack@2026.07.01',
  policies: {
    yearBoundary: 'lichun',
    monthBoundary: 'jie',
    ziHourDaySwitch: 'no_day_switch_in_v0_1',
    trueSolarTimeDefaultEnabled: false,
    lunarConversionScope: 'data_pack_acceptance_seed'
  }
};

module.exports = {
  baziRuleConfig
};
