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
        { id: 'maple_tree', name: '1周年栽培楓樹', reward: 0, note: '獎勵：隨機數量楓葉 + 隨機數量黃金楓葉', npc: '加加' },
        { id: 'find_cake', name: '再把蛋糕找回來吧！', reward: 300, note: '', npc: 'GM露露' }
      ],
      weekly: [
        { id: 'bowman_cake_event', name: '弓箭手村蛋糕大騷動', reward: 1200, lifetimeBonusShop: [5, 5, 5], note: '組隊任務 ｜ 累計前 3 次各加贈 5 黃金楓葉', npc: '明明夫人' },
        { id: 'hidden_candles', name: '尋找隱藏的蠟燭', reward: 0, rewardShop: 2, note: '另有隨機黃金楓葉（上限未知）', npc: 'GM露露' },
        { id: 'golden_pig', name: '擊敗黃金豬吧！', reward: 780, claims: 15, rewardPerClaim: 52, note: '每次 47~52 楓葉 (週五六日，每日上限 5 次)', npc: 'GM露露' }
      ],
      biweekly: [],
      onetime: [
        { id: 'maple_tree_gift', name: '楓樹準備的1周年禮物', reward: 0, rewardShop: 5, note: '', npc: 'GM露露' },
        { id: 'stage1_invitation', name: '1階段 吹散的邀請函', reward: 200, rewardShop: 2, note: '', npc: 'GM露露' },
        { id: 'stage2_cake', name: '2階段 消失的生日蛋糕', reward: 200, rewardShop: 2, note: '', npc: '加加' },
        { id: 'stage3_deliver', name: '3階段 傳達邀請函', reward: 0, note: '獎勵：名聲', npc: 'GM露露' },
        { id: 'stage4_celebrate', name: '4階段 一起慶祝生日', reward: 200, rewardShop: 2, note: '+ 活動勳章', npc: 'GM露露' }
      ]
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
