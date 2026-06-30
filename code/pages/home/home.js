Page({
  data: {
    today: {
      solar: '2026年6月30日',
      weekday: '星期二',
      lunar: '农历五月十六',
      ganzhi: '丙午年 甲午月 甲戌日',
      daoDate: '道历四七二三年',
      duty: '建日',
      clash: '冲龙',
      suit: ['静心', '整理', '排盘', '复盘'],
      avoid: ['急断', '反复问事', '夜深决策']
    },
    calendarNotes: [
      { label: '今日道历', value: '四七二三年 五月十六' },
      { label: '日课提示', value: '宜先定心，再看格局与用神' },
      { label: '修持建议', value: '少言急断，重在观象明理' }
    ]
  },

  onLoad() {
    const now = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    this.setData({
      'today.solar': `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
      'today.weekday': weekdays[now.getDay()]
    });
  },

  goToBazi() {
    wx.switchTab({ url: '/pages/bazi/bazi' });
  }
});
