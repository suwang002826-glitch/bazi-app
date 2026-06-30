const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const LUNAR_DAYS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];
const DUTIES = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];
const GODS = ['青龙', '明堂', '天刑', '朱雀', '金匮', '天德', '白虎', '玉堂', '天牢', '玄武', '司命', '勾陈'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日`;
}

function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function ganzhi(index) {
  const normalized = ((index % 60) + 60) % 60;
  return `${STEMS[normalized % 10]}${BRANCHES[normalized % 12]}`;
}

function dayIndex(date) {
  return Math.floor(date.getTime() / 86400000) + 49;
}

function monthGanzhi(date) {
  return ganzhi((date.getFullYear() - 1984) * 12 + date.getMonth() + 2);
}

function yearGanzhi(year) {
  return ganzhi(year - 1984);
}

function hourBranch(date) {
  return BRANCHES[Math.floor((date.getHours() + 1) / 2) % 12];
}

function lunarLabel(date) {
  return LUNAR_DAYS[(date.getDate() + 15) % 30];
}

function festivalLabel(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 7 && day === 1) return '建党日';
  if (month === 7 && day === 7) return '小暑';
  if (month === 7 && day === 23) return '大暑';
  if (month === 7 && day === 11) return '人口日';
  if (month === 8 && day === 1) return '建军节';
  return '';
}

function buildMonthCells(anchor) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const today = new Date();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const festival = festivalLabel(date);
    const currentMonth = date.getMonth() === month;
    const currentDay = currentMonth
      && date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate();
    const selected = currentMonth
      && date.getFullYear() === anchor.getFullYear()
      && date.getMonth() === anchor.getMonth()
      && date.getDate() === anchor.getDate();

    return {
      id: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      day: date.getDate(),
      lunar: festival || lunarLabel(date),
      ganzhi: ganzhi(dayIndex(date)),
      muted: !currentMonth,
      selected,
      today: currentDay,
      festival: Boolean(festival)
    };
  });
}

function buildAnalysis(date) {
  const index = dayIndex(date);
  const branchIndex = index % 12;
  const clash = BRANCHES[(branchIndex + 6) % 12];
  const duty = DUTIES[index % DUTIES.length];
  const god = GODS[(index + 3) % GODS.length];
  const hour = hourBranch(date);
  const hourRangeStart = ((BRANCHES.indexOf(hour) * 2 + 23) % 24);
  const hourRangeEnd = (hourRangeStart + 1) % 24;

  return {
    title: '智能分析',
    dateLine: `${formatDate(date)} ${formatTime(date)} · 周${WEEKDAYS[date.getDay()]}`,
    lunarLine: `农历 ${lunarLabel(date)} · ${yearGanzhi(date.getFullYear())}年 ${monthGanzhi(date)}月 ${ganzhi(index)}日 ${hour}时`,
    duty,
    god,
    clash: `冲${clash}`,
    hourText: `${hour}时 ${pad(hourRangeStart)}:00-${pad(hourRangeEnd)}:59`,
    good: ['祭祀', '整理', '复盘', '学习', '静心'],
    avoid: ['急断', '冲动决策', '反复犹疑', '深夜争执'],
    advice: '今日宜先定心，再做判断。若需排盘，可先记录真实时间与地点，后续用于命例复盘。'
  };
}

Page({
  data: {
    nowText: '',
    monthTitle: '',
    selected: {},
    weekLabels: WEEKDAYS,
    calendarCells: [],
    analysis: {}
  },

  onLoad() {
    this.refreshCalendar(new Date());
  },

  refreshCalendar(date) {
    this.setData({
      nowText: `${formatDate(date)} ${formatTime(date)}`,
      monthTitle: `${date.getFullYear()}年${pad(date.getMonth() + 1)}月`,
      selected: {
        day: date.getDate(),
        lunar: lunarLabel(date),
        ganzhi: `${yearGanzhi(date.getFullYear())}年 ${monthGanzhi(date)}月 ${ganzhi(dayIndex(date))}日 ${hourBranch(date)}时`,
        week: `周${WEEKDAYS[date.getDay()]}`
      },
      calendarCells: buildMonthCells(date),
      analysis: buildAnalysis(date)
    });
  }
});
