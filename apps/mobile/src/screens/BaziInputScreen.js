import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { calculateBazi } from '../api/baziApi';

const DEFAULT_FORM = {
  name: '测试命例',
  gender: '男',
  calendarType: 'solar',
  birthDate: '2000-01-01',
  birthClock: '08:00',
  lunarYear: '2023',
  lunarMonth: '8',
  lunarDay: '15',
  isLeapMonth: false,
  province: '北京市',
  city: '北京市',
  district: '东城区',
  longitude: '116.40',
  latitude: '39.90',
  trueSolarTime: true,
  group: '练习'
};

function assertDateTime(form) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate)) {
    throw new Error('出生日期请使用 YYYY-MM-DD 格式');
  }
  if (!/^\d{2}:\d{2}$/.test(form.birthClock)) {
    throw new Error('出生时辰请使用 HH:mm 格式');
  }
}

function buildPayload(form) {
  assertDateTime(form);
  const payload = {
    name: form.name.trim() || '未命名',
    gender: form.gender,
    calendarType: form.calendarType,
    birthTime: `${form.birthDate} ${form.birthClock}:00`,
    birthPlace: {
      province: form.province.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      lng: Number(form.longitude),
      lat: Number(form.latitude),
      coordType: 'GCJ02'
    },
    timeMode: form.trueSolarTime ? 'trueSolarTime' : 'beijingTime',
    options: {
      group: form.group.trim() || '练习'
    },
    clientMeta: {
      source: 'standalone-mobile-app',
      schemaVersion: 'bazi-request@1.0.0'
    }
  };

  if (form.calendarType === 'lunar') {
    payload.lunarDate = {
      year: Number(form.lunarYear),
      month: Number(form.lunarMonth),
      day: Number(form.lunarDay),
      isLeapMonth: Boolean(form.isLeapMonth)
    };
  }

  return payload;
}

function SegmentedButton({ active, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#85889c"
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
      />
    </View>
  );
}

export default function BaziInputScreen({ backendBaseUrl, onResult }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const payload = buildPayload(form);
      const reading = await calculateBazi(payload);
      onResult(reading, payload);
    } catch (nextError) {
      setError(nextError.message || '排盘失败，请检查后端服务是否已启动');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>八字排盘</Text>
        <Text style={styles.subtitle}>精准、稳定、专业的排盘系统</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>基础信息</Text>
        <Field label="姓名" value={form.name} onChangeText={(value) => updateField('name', value)} />
        <Text style={styles.label}>性别</Text>
        <View style={styles.segment}>
          <SegmentedButton active={form.gender === '男'} label="男" onPress={() => updateField('gender', '男')} />
          <SegmentedButton active={form.gender === '女'} label="女" onPress={() => updateField('gender', '女')} />
        </View>

        <Text style={styles.label}>历法</Text>
        <View style={styles.segment}>
          <SegmentedButton active={form.calendarType === 'solar'} label="公历" onPress={() => updateField('calendarType', 'solar')} />
          <SegmentedButton active={form.calendarType === 'lunar'} label="农历" onPress={() => updateField('calendarType', 'lunar')} />
        </View>

        <Field
          label={form.calendarType === 'lunar' ? '公历参考日期' : '出生日期'}
          placeholder="2000-01-01"
          value={form.birthDate}
          onChangeText={(value) => updateField('birthDate', value)}
        />
        <Field
          label="出生时辰"
          placeholder="08:00"
          value={form.birthClock}
          onChangeText={(value) => updateField('birthClock', value)}
        />

        {form.calendarType === 'lunar' && (
          <View style={styles.lunarBox}>
            <Text style={styles.helpText}>农历排盘会交给后端 data-pack 转换；当前覆盖边界以后端返回为准。</Text>
            <View style={styles.threeColumns}>
              <Field label="农历年" value={form.lunarYear} keyboardType="numeric" onChangeText={(value) => updateField('lunarYear', value)} />
              <Field label="月" value={form.lunarMonth} keyboardType="numeric" onChangeText={(value) => updateField('lunarMonth', value)} />
              <Field label="日" value={form.lunarDay} keyboardType="numeric" onChangeText={(value) => updateField('lunarDay', value)} />
            </View>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.labelInline}>闰月</Text>
                <Text style={styles.helpText}>只在农历闰月生日时打开</Text>
              </View>
              <Switch
                value={form.isLeapMonth}
                onValueChange={(value) => updateField('isLeapMonth', value)}
                trackColor={{ false: '#2f3244', true: '#c9a85d' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>地点与校时</Text>
        <Field label="省份" value={form.province} onChangeText={(value) => updateField('province', value)} />
        <Field label="城市" value={form.city} onChangeText={(value) => updateField('city', value)} />
        <Field label="区县" value={form.district} onChangeText={(value) => updateField('district', value)} />
        <View style={styles.twoColumns}>
          <Field label="经度" value={form.longitude} keyboardType="decimal-pad" onChangeText={(value) => updateField('longitude', value)} />
          <Field label="纬度" value={form.latitude} keyboardType="decimal-pad" onChangeText={(value) => updateField('latitude', value)} />
        </View>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.labelInline}>真太阳时</Text>
            <Text style={styles.helpText}>后端按经度校准，默认开启</Text>
          </View>
          <Switch
            value={form.trueSolarTime}
            onValueChange={(value) => updateField('trueSolarTime', value)}
            trackColor={{ false: '#2f3244', true: '#c9a85d' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>后端连接</Text>
        <Text style={styles.codeText}>{backendBaseUrl}</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={handleSubmit}
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
      >
        {loading ? <ActivityIndicator color="#121421" /> : <Text style={styles.primaryButtonText}>立即排盘</Text>}
      </Pressable>
    </ScrollView>
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
  title: {
    color: '#f5e4a7',
    fontSize: 32,
    fontWeight: '800'
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
    fontWeight: '800',
    marginBottom: 12
  },
  field: {
    flex: 1,
    marginBottom: 12
  },
  label: {
    color: '#f5e4a7',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8
  },
  labelInline: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  input: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b4056',
    color: '#ffffff',
    backgroundColor: '#121421',
    paddingHorizontal: 12,
    fontSize: 15
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b4056',
    paddingVertical: 11,
    backgroundColor: '#121421'
  },
  segmentButtonActive: {
    backgroundColor: '#d6bb72',
    borderColor: '#d6bb72'
  },
  segmentText: {
    color: '#d8d8e8',
    fontSize: 15,
    fontWeight: '800'
  },
  segmentTextActive: {
    color: '#121421'
  },
  lunarBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b4050',
    padding: 12,
    backgroundColor: '#241f2b',
    marginBottom: 12
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 10
  },
  threeColumns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 8
  },
  helpText: {
    color: '#b8bdcf',
    fontSize: 13,
    lineHeight: 19
  },
  codeText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20
  },
  errorText: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#5a2b35',
    color: '#ffe8e8',
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    marginBottom: 14
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: '#d6bb72'
  },
  primaryButtonDisabled: {
    opacity: 0.75
  },
  primaryButtonText: {
    color: '#121421',
    fontSize: 17,
    fontWeight: '900'
  }
});
