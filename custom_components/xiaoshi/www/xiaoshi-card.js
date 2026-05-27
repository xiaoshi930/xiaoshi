const loadCards = () => {
    import('./xiaoshi-card/xiaoshi-device-balance-button.js');
    import('./xiaoshi-card/xiaoshi-device-balance-card.js');
    import('./xiaoshi-card/xiaoshi-device-ha-info-button.js'); 
    import('./xiaoshi-card/xiaoshi-device-ha-info-card.js'); 
    import('./xiaoshi-card/xiaoshi-device-todo-button.js');
    import('./xiaoshi-card/xiaoshi-device-todo-card.js');
    import('./xiaoshi-card/xiaoshi-device-consumables-button.js');
    import('./xiaoshi-card/xiaoshi-device-consumables-card.js');

    import('./xiaoshi-phone/xiaoshi-phone-climate-card.js');
    import('./xiaoshi-phone/xiaoshi-phone-humidifier-card.js');
    import('./xiaoshi-phone/xiaoshi-phone-purifier-card.js');
    import('./xiaoshi-phone/xiaoshi-phone-computer-card.js');
    import('./xiaoshi-phone/xiaoshi-phone-light-card.js');
    import('./xiaoshi-phone/xiaoshi-phone-switch-card.js');
    import('./xiaoshi-phone/xiaoshi-phone-video-card.js');
    import('./xiaoshi-phone/xiaoshi-phone-image-card.js');

    import('./xiaoshi-pad/xiaoshi-pad-climate-card.js');
    import('./xiaoshi-pad/xiaoshi-pad-grid-card.js');
    
    import('./popup-card/popup-card.js');

    window.customCards = window.customCards || [];
    window.customCards.push(...cardConfigs);
};

const cardConfigs = [
  {
    type: 'xiaoshi-ha-info-button',
    name: '消逝HA信息按钮',
    description: '消逝HA信息按钮',
    preview: true
  },
  {
    type: 'xiaoshi-ha-info-card',
    name: '消逝HA信息卡片',
    description: '消逝HA信息卡片',
    preview: true
  },
  {
    type: 'xiaoshi-balance-button',
    name: '消逝余额信息按钮',
    description: '消逝余额信息按钮',
    preview: true
  },
  {
    type: 'xiaoshi-balance-card',
    name: '消逝余额信息卡片',
    description: '消逝余额信息卡片',
    preview: true
  },
  {
    type: 'xiaoshi-todo-button',
    name: '消逝待办信息按钮',
    description: '消逝待办信息按钮',
    preview: true
  },
  {
    type: 'xiaoshi-todo-card',
    name: '消逝待办信息卡片',
    description: '消逝待办信息卡片',
    preview: true
  },
  {
    type: 'xiaoshi-consumables-button',
    name: '消逝耗材信息按钮',
    description: '消逝耗材信息按钮',
    preview: true
  },
  {
    type: 'xiaoshi-consumables-card',
    name: '消逝耗材信息卡片',
    description: '消逝耗材信息卡片',
    preview: true
  },


  {
    type: 'xiaoshi-phone-climate-card',
    name: '消逝卡(移动端)-空调/水暖毯/热水器卡',
    description: '移动端空调/水暖毯/热水器卡',
    preview: true
  },
  {
    type: 'xiaoshi-phone-humidifier-card',
    name: '消逝卡(移动端)-加湿器卡',
    description: '移动端加湿器卡',
    preview: true
  },
  {
    type: 'xiaoshi-phone-purifier-card',
    name: '消逝卡(移动端)-净化器卡',
    description: '移动端净化器卡',
    preview: true
  },
  {
    type: 'xiaoshi-phone-computer-card',
    name: '消逝卡(移动端)-电脑卡',
    description: '移动端电脑卡'
  },
  {
    type: 'xiaoshi-phone-light-card',
    name: '消逝卡(移动端)-灯光卡',
    description: '移动端灯光卡'
  },
  {
    type: 'xiaoshi-phone-switch-card',
    name: '消逝卡(移动端)-插座卡',
    description: '移动端插座卡'
  },
  {
    type: 'xiaoshi-phone-video-card',
    name: '消逝卡(移动端)-视频卡',
    description: '移动端视频背景',
  },  
  {
    type: 'xiaoshi-phone-image-card',
    name: '消逝卡(移动端)-图片卡',
    description: '移动端图片背景',
  },


  {
    type: 'xiaoshi-pad-grid-card',
    name: '消逝卡(平板端)-分布卡',
    description: '温度分布、湿度分布'
  },
  {
    type: 'xiaoshi-pad-climate-card',
    name: '消逝卡(平板端)-空调/水暖毯/热水器/加湿器卡',
    description: '平板端空调/水暖毯/热水器卡/加湿器卡',
    preview: true
  }
];

loadCards();
console.info("%c 消逝卡-汇总卡 \n%c        v 1.3 ", "color: red; font-weight: bold; background: black", "color: white; font-weight: bold; background: black");
