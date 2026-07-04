const RULES = {
  // 换年：立春精确时刻换年（问真默认）
  changeYearBy: 'liching_exact_time',
  // 换月：十二节精确时刻换月（问真默认）
  changeMonthBy: 'jie_exact_time',
  // 换日：23点整（子初）换日（问真默认）
  changeDayBy: 'zi_shi_start_23',
  // 子时：默认不区分早晚子时，23点后直接用次日日柱+次日子时干
  ziShiRule: 'no_early_late',
  // 开关默认值
  defaultTrueSolarTime: false, // 真太阳时默认关闭
  defaultDST: false, // 夏令时默认关闭
  defaultEarlyLateZi: false, // 早晚子时默认关闭
  // 默认经纬度：东经120°（北京时间基准，不是北京当地116.4°）
  defaultLongitude: 120.0,
  defaultLatitude: 39.0
};

const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const STEM_ELEMENTS = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
const STEM_POLARITIES = ["yang", "yin", "yang", "yin", "yang", "yin", "yang", "yin", "yang", "yin"];

const HIDDEN_STEMS_BY_BRANCH = [
  ["癸"],
  ["己", "癸", "辛"],
  ["甲", "丙", "戊"],
  ["乙"],
  ["戊", "乙", "癸"],
  ["丙", "庚", "戊"],
  ["丁", "己"],
  ["己", "丁", "乙"],
  ["庚", "壬", "戊"],
  ["辛"],
  ["戊", "辛", "丁"],
  ["壬", "甲"]
];

const NAYIN_BY_PAIR = [
  "海中金", "炉中火", "大林木", "路旁土", "剑锋金",
  "山头火", "涧下水", "城头土", "白蜡金", "杨柳木",
  "泉中水", "屋上土", "霹雳火", "松柏木", "长流水",
  "沙中金", "山下火", "平地木", "壁上土", "金箔金",
  "覆灯火", "天河水", "大驿土", "钗钏金", "桑柘木",
  "大溪水", "沙中土", "天上火", "石榴木", "大海水"
];

const FIVE_ELEMENT_GENERATES = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木"
};

const FIVE_ELEMENT_CONTROLS = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木"
};

module.exports = {
  RULES,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  STEM_ELEMENTS,
  STEM_POLARITIES,
  HIDDEN_STEMS_BY_BRANCH,
  NAYIN_BY_PAIR,
  FIVE_ELEMENT_GENERATES,
  FIVE_ELEMENT_CONTROLS
};
