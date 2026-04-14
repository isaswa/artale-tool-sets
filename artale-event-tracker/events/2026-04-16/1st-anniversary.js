/**
 * 一周年紀念活動
 * Event period: 2026/04/16 (inclusive) - 2026/05/28 (exclusive, Thursday reset)
 * Last playable day: 2026/05/27
 */
(window.EVENTS = window.EVENTS || []).push({
    id: '1st-anniversary',
    name: '一周年紀念活動',
    startDate: '2026-04-16',
    endDate: '2026-05-28', // exclusive
    currency: '楓葉',
    shopCurrency: '黃金楓葉',
    tasks: {
      daily: [
        { id: 'daily_maple', name: '(任務名稱待定)', reward: 300, note: '' }
      ],
      weekly: [],
      biweekly: [],
      onetime: []
    },
    checkin: {
      maxDays: 42,
      milestones: [
        { day: 2, reward: 300 },
        { day: 5, reward: 300 },
        { day: 9, reward: 300 },
        { day: 12, reward: 300 },
        { day: 16, reward: 2, currency: '黃金楓葉' },
        { day: 19, reward: 300 },
        { day: 23, reward: 2, currency: '黃金楓葉' },
        { day: 28, reward: 300 }
      ]
    },
    shop: [
      { id: 'exp_coupon', name: '經驗值2倍券(30分鐘)', cost: 1, maxQty: 15, note: '無法交易' },
      { id: 'drop_coupon', name: '掉落率2倍券(30分鐘)', cost: 1, maxQty: 15, note: '無法交易' },
      { id: 'red_potion', name: '高濃縮紅色藥水×3', cost: 1, maxQty: 10, note: '無法交易' },
      { id: 'blue_potion', name: '高濃縮藍色藥水×3', cost: 1, maxQty: 10, note: '無法交易' },
      { id: 'maple_str', name: '楓葉(STR)', cost: 5, maxQty: 15, note: '' },
      { id: 'maple_dex', name: '楓葉(DEX)', cost: 5, maxQty: 15, note: '' },
      { id: 'maple_int', name: '楓葉(INT)', cost: 5, maxQty: 15, note: '' },
      { id: 'maple_luk', name: '楓葉(LUK)', cost: 5, maxQty: 15, note: '' }
    ]
});
