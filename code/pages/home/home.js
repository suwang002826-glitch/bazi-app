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
const JIE_TERMS = [
  { key: '立春', angle: 315, month: 2, day: 4, branch: '寅', index: 0 },
  { key: '惊蛰', angle: 345, month: 3, day: 6, branch: '卯', index: 1 },
  { key: '清明', angle: 15, month: 4, day: 5, branch: '辰', index: 2 },
  { key: '立夏', angle: 45, month: 5, day: 6, branch: '巳', index: 3 },
  { key: '芒种', angle: 75, month: 6, day: 6, branch: '午', index: 4 },
  { key: '小暑', angle: 105, month: 7, day: 7, branch: '未', index: 5 },
  { key: '立秋', angle: 135, month: 8, day: 8, branch: '申', index: 6 },
  { key: '白露', angle: 165, month: 9, day: 8, branch: '酉', index: 7 },
  { key: '寒露', angle: 195, month: 10, day: 8, branch: '戌', index: 8 },
  { key: '立冬', angle: 225, month: 11, day: 7, branch: '亥', index: 9 },
  { key: '大雪', angle: 255, month: 12, day: 7, branch: '子', index: 10 },
  { key: '小寒', angle: 285, month: 1, day: 6, branch: '丑', index: 11 }
];

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

function normalizeAngle(value) {
  return ((value % 360) + 360) % 360;
}

function angleDiff(current, target) {
  return ((normalizeAngle(current - target) + 540) % 360) - 180;
}

function sunLongitude(date) {
  const days = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const meanLongitude = normalizeAngle(280.46646 + 0.98564736 * days);
  const anomaly = normalizeAngle(357.52911 + 0.98560028 * days) * Math.PI / 180;
  const center = 1.914602 * Math.sin(anomaly) + 0.019993 * Math.sin(2 * anomaly) + 0.000289 * Math.sin(3 * anomaly);
  return normalizeAngle(meanLongitude + center);
}

function findSolarTermTime(year, term) {
  const termYear = term.month === 1 ? year + 1 : year;
  let start = new Date(termYear, term.month - 1, term.day - 3, 0, 0, 0, 0);
  let end = new Date(termYear, term.month - 1, term.day + 3, 0, 0, 0, 0);
  let startDiff = angleDiff(sunLongitude(start), term.angle);
  let endDiff = angleDiff(sunLongitude(end), term.angle);

  for (let expand = 0; startDiff > 0 || endDiff < 0; expand += 1) {
    if (expand > 6) break;
    start = new Date(start.getTime() - 86400000);
    end = new Date(end.getTime() + 86400000);
    startDiff = angleDiff(sunLongitude(start), term.angle);
    endDiff = angleDiff(sunLongitude(end), term.angle);
  }

  for (let i = 0; i < 42; i += 1) {
    const mid = new Date((start.getTime() + end.getTime()) / 2);
    const diff = angleDiff(sunLongitude(mid), term.angle);
    if (diff >= 0) {
      end = mid;
    } else {
      start = mid;
    }
  }

  return end;
}

function getActiveJie(date) {
  const timeline = [];
  [date.getFullYear() - 1, date.getFullYear(), date.getFullYear() + 1].forEach((year) => {
    JIE_TERMS.forEach((term) => {
      timeline.push({ ...term, date: findSolarTermTime(year, term) });
    });
  });
  timeline.sort((a, b) => a.date - b.date);
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    if (date >= timeline[i].date) return timeline[i];
  }
  return timeline[0];
}

function dayIndex(date) {
  return Math.floor(date.getTime() / 86400000) + 49;
}

function monthGanzhi(date) {
  const activeJie = getActiveJie(date);
  return ganzhi((date.getFullYear() - 1984) * 12 + activeJie.index + 2);
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
  if (month === 7 && day === 11) return '人口日';
  if (month === 7 && day === 23) return '大暑';
  if (month === 8 && day === 1) return '建军节';
  return '';
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function withTimeFrom(date, source) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    source.getHours(),
    source.getMinutes(),
    0,
    0
  );
}

function buildMonthCells(viewDate, selectedDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
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
    const selected = date.getFullYear() === selectedDate.getFullYear()
      && date.getMonth() === selectedDate.getMonth()
      && date.getDate() === selectedDate.getDate();
    const interactiveDate = withTimeFrom(date, selectedDate);

    return {
      id: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      timestamp: interactiveDate.getTime(),
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
    good: pickAlmanac(date, true),
    avoid: pickAlmanac(date, false),
    advice: buildAdvice(date, duty, god)
  };
}

function pickAlmanac(date, positive) {
  const goodPool = [
    ['祭祀', '整理', '复盘', '学习', '静心'],
    ['开光', '订盟', '会友', '问学', '立约'],
    ['祈福', '修整', '记录', '归档', '择时'],
    ['安床', '出行', '拜访', '求医', '纳采']
  ];
  const avoidPool = [
    ['急断', '冲动决策', '反复犹疑', '深夜争执'],
    ['破土', '动怒', '借贷', '口舌争执'],
    ['迁怒', '冒进', '轻诺', '过度消耗'],
    ['仓促签约', '远行冒险', '情绪决策']
  ];
  const source = positive ? goodPool : avoidPool;
  return source[Math.abs(dayIndex(date)) % source.length];
}

function buildAdvice(date, duty, god) {
  const hints = [
    `今日为${duty}日，值神${god}，宜先定心，再做判断。`,
    `所选日期以${ganzhi(dayIndex(date))}日为主，适合先记录事实，再看格局。`,
    `若需排盘，可先确认出生时间、地点与真太阳时，后续用于命例复盘。`,
    `日课只作观象参考，重要事项仍以现实条件和审慎判断为准。`
  ];
  return hints[Math.abs(date.getDate()) % hints.length];
}

Page({
  data: {
    nowText: '',
    monthTitle: '',
    selectedTimestamp: 0,
    viewTimestamp: 0,
    selected: {},
    weekLabels: WEEKDAYS,
    calendarCells: [],
    analysis: {}
  },

  onLoad() {
    this.refreshCalendar(new Date());
  },

  refreshCalendar(selectedDate, viewDate = selectedDate) {
    this.setData({
      nowText: `${formatDate(selectedDate)} ${formatTime(selectedDate)}`,
      monthTitle: `${viewDate.getFullYear()}年${pad(viewDate.getMonth() + 1)}月`,
      selectedTimestamp: selectedDate.getTime(),
      viewTimestamp: viewDate.getTime(),
      selected: {
        day: selectedDate.getDate(),
        lunar: lunarLabel(selectedDate),
        ganzhi: `${yearGanzhi(selectedDate.getFullYear())}年 ${monthGanzhi(selectedDate)}月 ${ganzhi(dayIndex(selectedDate))}日 ${hourBranch(selectedDate)}时`,
        week: `周${WEEKDAYS[selectedDate.getDay()]}`
      },
      calendarCells: buildMonthCells(viewDate, selectedDate),
      analysis: buildAnalysis(selectedDate)
    });
  },

  onSelectDate(event) {
    const timestamp = Number(event.currentTarget.dataset.timestamp);
    if (!Number.isFinite(timestamp)) return;
    const selectedDate = new Date(timestamp);
    this.refreshCalendar(selectedDate, selectedDate);
  },

  changeMonth(offset) {
    const selectedDate = this.data.selectedTimestamp ? new Date(this.data.selectedTimestamp) : new Date();
    const viewDate = this.data.viewTimestamp ? new Date(this.data.viewTimestamp) : selectedDate;
    const targetView = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + offset,
      1,
      selectedDate.getHours(),
      selectedDate.getMinutes(),
      0,
      0
    );
    const clampedDay = Math.min(selectedDate.getDate(), daysInMonth(targetView.getFullYear(), targetView.getMonth()));
    const nextSelected = new Date(
      targetView.getFullYear(),
      targetView.getMonth(),
      clampedDay,
      selectedDate.getHours(),
      selectedDate.getMinutes(),
      0,
      0
    );
    this.refreshCalendar(nextSelected, targetView);
  },

  onPrevMonth() {
    this.changeMonth(-1);
  },

  onNextMonth() {
    this.changeMonth(1);
  },

  goBazi() {
    wx.switchTab({ url: '/pages/bazi/bazi' });
  }
});
