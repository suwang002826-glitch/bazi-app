Page({
  data: {
    primaryTools: [
      {
        title: '八字排盘',
        icon: '命',
        className: 'bazi-card',
        desc: '看清先天结构与长期节律',
        tags: ['四柱', '大运', '流年', '喜用'],
        action: '立即排盘',
        image: '/assets/home/bazi.jpg',
        url: '/pages/bazi/bazi',
        tab: true
      },
      {
        title: '六爻占卜',
        icon: '卦',
        className: 'liuyao-card',
        desc: '一事一问，梳理当下变化',
        tags: ['世应', '用神', '动爻', '应期'],
        action: '开始占卜',
        image: '/assets/home/liuyao.jpg',
        url: '/pages/liuyao/liuyao',
        tab: true
      },
      {
        title: '奇门遁甲',
        icon: '局',
        className: 'qimen-card',
        desc: '择时择向，辅助行动决策',
        tags: ['九宫', '八门', '值符', '用宫'],
        action: '奇门排盘',
        image: '/assets/home/qimen.jpg',
        url: '/pages/qimen/qimen',
        tab: true
      }
    ]
  },

  goTo(event) {
    const { url, tab } = event.currentTarget.dataset;
    const isTab = tab === true || tab === 'true';
    if (isTab) {
      wx.switchTab({ url });
      return;
    }
    wx.navigateTo({ url });
  }
});
