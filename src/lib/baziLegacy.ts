import { Lunar, Solar } from 'lunar-typescript'

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

const parseDate = (dateText: string) => {
  const [year, month, day] = dateText.split('-').map(Number)
  if (!year || !month || !day) {
    throw new Error('请填写完整的出生日期。')
  }
  return { year, month, day }
}

const parseTime = (timeText: string) => {
  const [hour, minute] = timeText.split(':').map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error('请填写完整的出生时间。')
  }
  return { hour, minute }
}

const joinList = (items: string[]) => (items.length > 0 ? items.join('、') : '无')

export const calculateBazi = (input: BaziInput): BaziResult => {
  const { year, month, day } = parseDate(input.birthDate)
  const { hour, minute } = parseTime(input.birthTime)

  const lunar =
    input.calendarType === 'solar'
      ? Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar()
      : Lunar.fromYmdHms(
          year,
          input.isLeapMonth ? -month : month,
          day,
          hour,
          minute,
          0,
        )

  const solar = lunar.getSolar()
  const eightChar = lunar.getEightChar()

  const pillars: PillarDetail[] = [
    {
      label: '年柱',
      pillar: eightChar.getYear(),
      gan: eightChar.getYearGan(),
      zhi: eightChar.getYearZhi(),
      hiddenStems: joinList(eightChar.getYearHideGan()),
      wuxing: eightChar.getYearWuXing(),
      nayin: eightChar.getYearNaYin(),
      shishenGan: eightChar.getYearShiShenGan(),
      shishenZhi: joinList(eightChar.getYearShiShenZhi()),
      xunkong: eightChar.getYearXunKong(),
    },
    {
      label: '月柱',
      pillar: eightChar.getMonth(),
      gan: eightChar.getMonthGan(),
      zhi: eightChar.getMonthZhi(),
      hiddenStems: joinList(eightChar.getMonthHideGan()),
      wuxing: eightChar.getMonthWuXing(),
      nayin: eightChar.getMonthNaYin(),
      shishenGan: eightChar.getMonthShiShenGan(),
      shishenZhi: joinList(eightChar.getMonthShiShenZhi()),
      xunkong: eightChar.getMonthXunKong(),
    },
    {
      label: '日柱',
      pillar: eightChar.getDay(),
      gan: eightChar.getDayGan(),
      zhi: eightChar.getDayZhi(),
      hiddenStems: joinList(eightChar.getDayHideGan()),
      wuxing: eightChar.getDayWuXing(),
      nayin: eightChar.getDayNaYin(),
      shishenGan: eightChar.getDayShiShenGan(),
      shishenZhi: joinList(eightChar.getDayShiShenZhi()),
      xunkong: eightChar.getDayXunKong(),
    },
    {
      label: '时柱',
      pillar: eightChar.getTime(),
      gan: eightChar.getTimeGan(),
      zhi: eightChar.getTimeZhi(),
      hiddenStems: joinList(eightChar.getTimeHideGan()),
      wuxing: eightChar.getTimeWuXing(),
      nayin: eightChar.getTimeNaYin(),
      shishenGan: eightChar.getTimeShiShenGan(),
      shishenZhi: joinList(eightChar.getTimeShiShenZhi()),
      xunkong: eightChar.getTimeXunKong(),
    },
  ]

  return {
    displayName: input.name.trim() || '未命名命盘',
    genderText: input.gender === 'male' ? '男' : '女',
    solarText: solar.toYmdHms(),
    lunarText: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`,
    zodiac: lunar.getYearShengXiao(),
    jieQi: lunar.getJieQi() || '非节气交节点',
    pillars,
    taiYuan: eightChar.getTaiYuan(),
    mingGong: eightChar.getMingGong(),
    shenGong: eightChar.getShenGong(),
    notes: [
      '当前按输入时间直接排盘，真太阳时换算尚未启用。',
      '月柱、节气、闰月等结果需要用验收样例持续复核。',
    ],
  }
}
