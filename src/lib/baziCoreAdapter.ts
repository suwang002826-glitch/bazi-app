import { calculateBaZi, type CoreInput, type CorePillar, type CoreResult } from '../../core/engine.js'

export type CalendarType = 'solar' | 'lunar'
export type Gender = 'male' | 'female'

export interface BaziInput {
  name: string
  gender: Gender
  calendarType: CalendarType
  birthDate: string
  birthTime: string
  birthPlace: string
  isLeapMonth: boolean
  longitude?: string
  latitude?: string
  useDst?: boolean
  useTrueSolarTime?: boolean
}

export interface PillarDetail {
  label: string
  pillar: string
  gan: string
  zhi: string
  hiddenStems: string
  wuxing: string
  nayin: string
  shishenGan: string
  shishenZhi: string
  xunkong: string
}

export interface BaziResult {
  displayName: string
  genderText: string
  solarText: string
  lunarText: string
  zodiac: string
  jieQi: string
  pillars: PillarDetail[]
  taiYuan: string
  mingGong: string
  shenGong: string
  notes: string[]
}

const pillarKeys = ['year', 'month', 'day', 'hour'] as const

const pillarLabels: Record<(typeof pillarKeys)[number], string> = {
  year: '年柱',
  month: '月柱',
  day: '日柱',
  hour: '时柱',
}

const stemElements: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
}

const branchElements: Record<string, string> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
}

function parseDate(dateText: string) {
  const [year, month, day] = dateText.split('-').map(Number)
  if (!year || !month || !day) {
    throw new Error('请填写完整的出生日期。')
  }
  return { year, month, day }
}

function parseTime(timeText: string) {
  const [hour, minute] = timeText.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error('请填写完整的出生时间。')
  }
  return { hour, minute }
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function normalizeCoordinate(value: string | undefined, fallback: number, label: string) {
  if (value === undefined || value === '') return fallback
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    throw new Error(`请填写有效的${label}。`)
  }
  return numeric
}

function joinList(items: string[]) {
  return items.length ? items.join('、') : '无'
}

function formatSolarTime(input: BaziInput) {
  const { year, month, day } = parseDate(input.birthDate)
  const { hour, minute } = parseTime(input.birthTime)
  return `${year}-${pad2(month)}-${pad2(day)} ${pad2(hour)}:${pad2(minute)}:00`
}

export function toCoreInput(input: BaziInput): CoreInput {
  if (input.calendarType !== 'solar') {
    throw new Error('v0.2.0 核心对接版先支持公历排盘，农历转换将在后续版本接入。')
  }

  return {
    solar_time: formatSolarTime(input),
    longitude: normalizeCoordinate(input.longitude, 120, '经度'),
    latitude: normalizeCoordinate(input.latitude, 39, '纬度'),
    use_dst: Boolean(input.useDst),
    use_true_solar: Boolean(input.useTrueSolarTime),
  }
}

function toPillarDetail(key: (typeof pillarKeys)[number], pillar: CorePillar): PillarDetail {
  return {
    label: pillarLabels[key],
    pillar: pillar.text,
    gan: pillar.stem,
    zhi: pillar.branch,
    hiddenStems: joinList(pillar.hidden_stems),
    wuxing: `${stemElements[pillar.stem] || '未定'} / ${branchElements[pillar.branch] || '未定'}`,
    nayin: pillar.nayin,
    shishenGan: pillar.stem_ten_god,
    shishenZhi: joinList(pillar.hidden_ten_gods),
    xunkong: joinList(pillar.kong_wang),
  }
}

function toBaziResult(input: BaziInput, coreResult: CoreResult): BaziResult {
  return {
    displayName: input.name.trim() || '未命名命盘',
    genderText: input.gender === 'male' ? '男' : '女',
    solarText: coreResult.meta.adjusted_time,
    lunarText: 'v0.2.0 核心对接版暂不展示农历换算',
    zodiac: '待接入',
    jieQi: '按 v0.1.0-core 精确节气规则排盘',
    pillars: pillarKeys.map((key) => toPillarDetail(key, coreResult.pillars[key])),
    taiYuan: '未启用',
    mingGong: '未启用',
    shenGong: '未启用',
    notes: [
      '当前结果由 v0.1.0-core 黄金引擎计算。',
      '换年、换月、换日、子时、真太阳时与夏令时规则均沿用封版核心。',
      '农历转换、胎元、命宫、身宫等附加项将在后续版本接入。',
    ],
  }
}

export function calculateBaziWithCore(input: BaziInput): BaziResult {
  return toBaziResult(input, calculateBaZi(toCoreInput(input)))
}
