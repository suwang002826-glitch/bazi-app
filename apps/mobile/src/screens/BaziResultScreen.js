import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function text(value, fallback = '待返回') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return String(value);
}

function formatConversion(conversion = {}) {
  if (conversion.calendarType !== 'lunar') {
    return '公历输入，无需农历转换';
  }
  return `农历已转换为公历 ${text(conversion.solarDate)}，来源 ${text(conversion.source)}`;
}

export default function BaziResultScreen({ backendBaseUrl, payload, reading, onBack }) {
  const result = reading && reading.result || {};
  const calendarProviderInfo = result.calendarProviderInfo || {};
  const lunarProvider = calendarProviderInfo.lunar || {};
  const solarTermProvider = calendarProviderInfo.solarTerm || {};
  const pillars = Array.isArray(result.pillars) ? result.pillars : [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>排盘结果</Text>
        <Text style={styles.title}>{text(result.displayName, payload && payload.name || '命例')}</Text>
        <Text style={styles.subtitle}>四柱由后端统一计算，前端只负责展示结果与来源。</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>四柱</Text>
        <View style={styles.pillarGrid}>
          {pillars.map((pillar) => (
            <View key={pillar.label} style={styles.pillarCard}>
              <Text style={styles.pillarLabel}>{pillar.label}</Text>
              <Text style={styles.pillarValue}>{pillar.value}</Text>
              <Text style={styles.pillarMeta}>{text(pillar.stemTenGod)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>时间校验</Text>
        <InfoRow label="北京时间" value={result.timeCalibration && result.timeCalibration.beijingTime} />
        <InfoRow label="真太阳时" value={result.timeCalibration && result.timeCalibration.trueSolarTime} />
        <InfoRow label="排盘模式" value={result.timeMode === 'trueSolarTime' ? '真太阳时' : '北京时间'} />
        <InfoRow label="经纬度" value={`${text(result.timeCalibration && result.timeCalibration.longitude)} / ${text(result.timeCalibration && result.timeCalibration.latitude)}`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>历法与来源</Text>
        <InfoRow label="农历转换" value={formatConversion(result.calendarConversion)} />
        <InfoRow label="农历数据源" value={lunarProvider.provider} />
        <InfoRow label="数据版本" value={lunarProvider.calendarDataVersion || lunarProvider.dataPackId} />
        <InfoRow label="节气来源" value={solarTermProvider.provider} />
        <InfoRow label="后端地址" value={backendBaseUrl} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>专业摘要</Text>
        <Text style={styles.copy}>{text(result.chartSummary && result.chartSummary.oneLine, '后端暂未返回摘要')}</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onBack} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>返回修改</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{text(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 34
  },
  header: {
    paddingTop: 24,
    paddingBottom: 18
  },
  eyebrow: {
    color: '#d6bb72',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900'
  },
  subtitle: {
    color: '#d8d8e8',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8
  },
  card: {
    borderWidth: 1,
    borderColor: '#34394d',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#1d2130',
    marginBottom: 14
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 12
  },
  pillarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  pillarCard: {
    width: '47%',
    minHeight: 108,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4d5164',
    backgroundColor: '#121421',
    padding: 12,
    justifyContent: 'space-between'
  },
  pillarLabel: {
    color: '#b8bdcf',
    fontSize: 13,
    fontWeight: '800'
  },
  pillarValue: {
    color: '#f5e4a7',
    fontSize: 30,
    fontWeight: '900'
  },
  pillarMeta: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  infoRow: {
    borderTopWidth: 1,
    borderTopColor: '#34394d',
    paddingVertical: 10
  },
  infoLabel: {
    color: '#d6bb72',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20
  },
  copy: {
    color: '#d8d8e8',
    fontSize: 15,
    lineHeight: 23
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d6bb72'
  },
  secondaryButtonText: {
    color: '#f5e4a7',
    fontSize: 16,
    fontWeight: '900'
  }
});
