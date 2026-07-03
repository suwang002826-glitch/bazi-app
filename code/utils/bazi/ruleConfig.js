const baziRuleConfig = {
  ruleProfileVersion: 'bazi-rule-profile@v0.2',
  algorithmVersion: 'bazi-local-engine@0.2',
  calendarDataVersion: 'solarTerms-precise-1900-2100.json',
  policies: {
    yearBoundary: 'liching_exact_time',
    monthBoundary: 'jie12_exact_second',
    ziHourRule: 'zi_shi_start_23',
    ziHourDaySwitch: 'late_zi_keeps_day_hour_stem_uses_next_day',
    trueSolarTimeDefaultEnabled: 'disabled_by_default',
    trueSolarReferenceLongitude: 120,
    trueSolarReferenceLatitude: 39,
    chinaSummerTime: 'enabled_only_1986_1991_official_schedule',
    chinaSummerTimeDefaultEnabled: 'auto_detect_within_range',
    lunarConversionScope: 'data_pack_1901_2100'
  }
};

module.exports = {
  baziRuleConfig
};
