const baziRuleConfig = {
  ruleProfileVersion: 'bazi-rule-profile@2026.07.02-control',
  algorithmVersion: 'bazi-local-engine@0.1.0',
  calendarDataVersion: 'lunar-data-pack@2026.07.02-preview',
  policies: {
    runtimeAuthority: 'backend_service',
    clientRole: 'input_display_validation_terminal',
    solarTermAuthority: 'hko_runtime_preview_2024_2026_with_local_fallback',
    yearBoundary: 'lichun',
    monthBoundary: 'jie',
    ziHourDaySwitch: 'explicit_policy_required',
    earlyLateZiHour: 'supported_as_explicit_school_option',
    trueSolarTimeDefaultEnabled: false,
    trueSolarTimePolicy: 'explicit_per_case_required',
    lunarConversionScope: 'data_pack_candidate_preview'
  }
};

module.exports = {
  baziRuleConfig
};
