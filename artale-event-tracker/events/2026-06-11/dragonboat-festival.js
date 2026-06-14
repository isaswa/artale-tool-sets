/**
 * 端午節活動 - Dragon Boat Festival 2026
 * Event period: 2026/06/11 (inclusive) - 2026/07/09 (exclusive, ends 07/09 00:00 UTC+0)
 * Last playable day: 2026/07/08 (Wednesday). Event runs 28 days.
 * Daily-gift check-in: 14 days only (簽到滿 14 次即完成，不需再簽).
 *
 * This event has NO currency/shop. Rewards are heterogeneous items
 * (洗血水 / 洗魔水 / 經驗2倍券 / 掉落2倍券 / 勳章 ...). We use a dummy
 * currency with 0-value rewards and display the reward text itself.
 * `itemRewards: true` switches the UI into reward-text display mode.
 */
(window.EVENTS = window.EVENTS || []).push({
    id: 'dragonboat-festival-event-2026',
    name: '端午節活動',
    startDate: '2026-06-11',
    endDate: '2026-07-09', // exclusive (ends 07/09 00:00 UTC+0)
    currency: '獎勵',       // dummy currency (rewards are items, tracked as text)
    itemRewards: true,      // display reward text instead of currency amounts
    tasks: {
      daily: [
        { id: 'remove_bad_luck', name: '消除厄運', reward: 0, rewardText: '粽子 (HP/MP 藥水)', npc: '屈原' },
        { id: 'sachet_buff', name: '香包增益效果', reward: 0, rewardText: '香包 (15分鐘 +3AD +5AP buff)', npc: 'GM露露' },
        { id: 'vote_zongzi', name: '投票粽子對決', reward: 0, rewardText: '粽子 (HP/MP 藥水)', npc: 'GM露露' }
      ],
      weekly: [
        { id: 'slay_five_poisons', name: '消滅五毒', reward: 0, rewardText: '洗血水×3 + 洗魔水×3 + 怪物召喚包', npc: '法海和尚' },
        { id: 'quyuan_wish', name: '屈原的願望', reward: 0, rewardText: '經驗2倍券×2', npc: 'GM露露' },
        { id: 'noon_water', name: '午時水', reward: 0, rewardText: '端午之水 (30分鐘 +5AD +10AP buff)', npc: '潔淨的樹根' },
        { id: 'festival_gift_pack', name: '端午節禮物包', reward: 0, rewardText: '經驗2倍券×2 + 掉落2倍券×2 + 兌換券×1 + 端午粽子椅', npc: '加加' }
      ],
      biweekly: [],
      onetime: [
        { id: 'egg_standing_game', name: '立蛋遊戲', reward: 0, rewardText: '經驗2倍券×1 + 掉落2倍券×1', npc: 'GM露露' }
      ]
    },
    checkin: {
      maxDays: 14,
      milestones: [],
      // 14-day daily gift calendar (image 2). Each day requires killing 250
      // level-range monsters to unlock. Rendered 7 days per row.
      // day 1 = 勳章, day 14 = 洗血水(水箱), coupons distributed across days 2-13.
      calendar: [
        { day: 1,  label: '蒼翠端午勳章', sub: '全屬+2 (+500HP)' },
        { day: 2,  label: '掉落2倍券' },
        { day: 3,  label: '經驗2倍券' },
        { day: 4,  label: '經驗2倍券' },
        { day: 5,  label: '掉落2倍券' },
        { day: 6,  label: '經驗2倍券' },
        { day: 7,  label: '貝拉裝飾戒指箱', sub: '聊天戒指 / 名牌戒指' },
        { day: 8,  label: '經驗2倍券' },
        { day: 9,  label: '掉落2倍券' },
        { day: 10, label: '經驗2倍券' },
        { day: 11, label: '經驗2倍券' },
        { day: 12, label: '掉落2倍券' },
        { day: 13, label: '經驗2倍券' },
        { day: 14, label: '高級縮減水箱', sub: '洗血水×10 + 洗魔水×10' }
      ]
    },
    shop: []
});
