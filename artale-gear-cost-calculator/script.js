// === Constants ===
const STATS_KEY = 'gear-cost-stats';
const PLANS_KEY = 'gear-cost-plans';

// Slot metadata
const SLOTS = [
  { id: 'hat',      name: '帽子', hasWatk: false },
  { id: 'medal',    name: '勳章', hasWatk: false },
  { id: 'face',     name: '臉飾', hasWatk: false },
  { id: 'ring1',    name: '戒指1', hasWatk: false },
  { id: 'ring2',    name: '戒指2', hasWatk: false },
  { id: 'eye',      name: '眼飾', hasWatk: false },
  { id: 'earring',  name: '耳環', hasWatk: false },
  { id: 'shoulder', name: '肩膀', hasWatk: false },
  { id: 'cape',     name: '披風', hasWatk: false },
  { id: 'top',      name: '上衣', hasWatk: false },
  { id: 'overall',  name: '套服', hasWatk: false },
  { id: 'pendant',  name: '項鍊', hasWatk: false },
  { id: 'weapon',   name: '武器', hasWatk: true },
  { id: 'shield',   name: '盾牌', hasWatk: false },
  { id: 'glove',    name: '手套', hasWatk: true },
  { id: 'bottom',   name: '下衣', hasWatk: false },
  { id: 'belt',     name: '腰帶', hasWatk: false },
  { id: 'ring3',    name: '戒指3', hasWatk: false },
  { id: 'ring4',    name: '戒指4', hasWatk: false },
  { id: 'shoe',     name: '鞋子', hasWatk: false },
];

const STAT_KEYS = ['str', 'dex', 'int', 'luk'];

// === DOM refs ===
let strBase, strExtra, strTotal, dexBase, dexExtra, dexTotal;
let intBase, intExtra, intTotal, lukBase, lukExtra, lukTotal;
let mwEnabled, mwLevel, mwInfo;
let atkMaxInput, watkValue, currentMaxAtk;
let jobSelect, weaponGroup, weaponSelect;
let rankingArea;

// Swap form
let swapForm, swapPlaceholder, swapFormTitle;
let swapCost, swapCostUnit;
let swapConfirmBtn, swapDeleteBtn;

// Swap stat inputs { cur: { str, dex, int, luk, all, watk, matk }, tgt: { ... } }
let swapInputs = {};
let curAllstatCheck, tgtAllstatCheck;
let curStatRow, curAllstatRow, tgtStatRow, tgtAllstatRow;

// Lock secondary
let lockSecCheck, lockSecValue, lockSecStat;

// Overall toggle
let overallToggle, overallCheck;
let isOverallMode = false;

// State
let activeSlotId = null;
let plans = {};

// === Helpers ===
function num(el) { return parseFloat(el.value) || 0; }
function intVal(el) { return parseInt(el.value) || 0; }

// === Stat input validation ===
function validateStatInput(input, max) {
  const raw = input.value.trim();
  const cell = input.closest('.swap-stat-cell');
  const existing = cell.querySelector('.validation-tip');

  // Remove old tooltip
  if (existing) existing.remove();
  input.classList.remove('input-invalid');

  if (raw === '' || raw === '0') return;

  // Must be non-negative integer
  if (!/^\d+$/.test(raw)) {
    showTip(cell, input, '請輸入正整數');
    return;
  }

  const val = parseInt(raw, 10);
  if (val > max) {
    showTip(cell, input, '最大值 ' + max);
    return;
  }
}

function showTip(cell, input, msg) {
  input.classList.add('input-invalid');
  const tip = document.createElement('span');
  tip.className = 'validation-tip';
  tip.textContent = msg;
  cell.appendChild(tip);
  setTimeout(() => { if (tip.parentNode) tip.remove(); }, 2000);
}

function clampStatOnBlur(input, max) {
  const raw = input.value.trim();
  if (raw === '') { input.value = '0'; return; }
  const val = parseInt(raw, 10);
  if (isNaN(val) || val < 0) { input.value = '0'; return; }
  if (val > max) { input.value = max; return; }
  input.value = val;
}

// === Init ===
function init() {
  // Cache DOM — right panel
  strBase = document.getElementById('str-base');
  strExtra = document.getElementById('str-extra');
  strTotal = document.getElementById('str-total');
  dexBase = document.getElementById('dex-base');
  dexExtra = document.getElementById('dex-extra');
  dexTotal = document.getElementById('dex-total');
  intBase = document.getElementById('int-base');
  intExtra = document.getElementById('int-extra');
  intTotal = document.getElementById('int-total');
  lukBase = document.getElementById('luk-base');
  lukExtra = document.getElementById('luk-extra');
  lukTotal = document.getElementById('luk-total');
  mwEnabled = document.getElementById('mw-enabled');
  mwLevel = document.getElementById('mw-level');
  mwInfo = document.getElementById('mw-info');
  atkMaxInput = document.getElementById('atk-max');
  watkValue = document.getElementById('watk-value');
  currentMaxAtk = document.getElementById('current-max-atk');
  jobSelect = document.getElementById('job-select');
  weaponGroup = document.getElementById('weapon-group');
  weaponSelect = document.getElementById('weapon-select');
  rankingArea = document.getElementById('ranking-area');

  // Swap form
  swapForm = document.getElementById('swap-form');
  swapPlaceholder = document.getElementById('swap-placeholder');
  swapFormTitle = document.getElementById('swap-form-title');
  swapCost = document.getElementById('swap-cost');
  swapCostUnit = document.getElementById('swap-cost-unit');
  swapConfirmBtn = document.getElementById('swap-confirm-btn');
  swapDeleteBtn = document.getElementById('swap-delete-btn');

  // Swap stat inputs
  swapInputs = {
    cur: {
      str: document.getElementById('cur-str'),
      dex: document.getElementById('cur-dex'),
      int: document.getElementById('cur-int'),
      luk: document.getElementById('cur-luk'),
      all: document.getElementById('cur-all'),
      watk: document.getElementById('cur-watk'),
      matk: document.getElementById('cur-matk'),
    },
    tgt: {
      str: document.getElementById('tgt-str'),
      dex: document.getElementById('tgt-dex'),
      int: document.getElementById('tgt-int'),
      luk: document.getElementById('tgt-luk'),
      all: document.getElementById('tgt-all'),
      watk: document.getElementById('tgt-watk'),
      matk: document.getElementById('tgt-matk'),
    }
  };
  curAllstatCheck = document.getElementById('cur-allstat-check');
  tgtAllstatCheck = document.getElementById('tgt-allstat-check');
  curStatRow = document.getElementById('cur-stat-row');
  curAllstatRow = document.getElementById('cur-allstat-row');
  tgtStatRow = document.getElementById('tgt-stat-row');
  tgtAllstatRow = document.getElementById('tgt-allstat-row');

  // Lock secondary
  lockSecCheck = document.getElementById('lock-sec-check');
  lockSecValue = document.getElementById('lock-sec-value');
  lockSecStat = document.getElementById('lock-sec-stat');

  // Overall toggle
  overallToggle = document.getElementById('overall-toggle');
  overallCheck = document.getElementById('overall-check');

  // Populate jobs
  populateJobs();

  // Load saved state
  loadStats();
  loadPlans();

  // Restore overall mode
  const savedStats = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
  if (savedStats.overallMode) {
    isOverallMode = true;
    overallCheck.checked = true;
  }

  // Setup job/weapon
  const job = getSelectedJob();
  populateWeapons(job);
  if (savedStats.weapon) weaponSelect.value = savedStats.weapon;

  // Update displays
  updateJobUI();
  updateLockSecUI();
  updateStatTotals();
  updateWATK();
  applyOverallMode();
  updateRanking();
  updateGridDots();

  // --- Event listeners ---

  // Stat inputs (right panel)
  const allStatInputs = [strBase, strExtra, dexBase, dexExtra, intBase, intExtra, lukBase, lukExtra];
  const allInputs = [...allStatInputs, atkMaxInput];
  allInputs.forEach(el => el.addEventListener('input', saveStats));
  allStatInputs.forEach(el => {
    el.addEventListener('input', updateStatTotals);
    el.addEventListener('input', updateWATK);
    el.addEventListener('input', updateRanking);
  });
  atkMaxInput.addEventListener('input', updateWATK);
  atkMaxInput.addEventListener('input', updateRanking);

  allInputs.forEach(el =>
    el.addEventListener('blur', () => {
      el.value = Math.max(0, Math.floor(parseFloat(el.value) || 0));
      saveStats();
    })
  );

  // MW
  mwEnabled.addEventListener('change', () => {
    saveStats(); updateStatTotals(); updateWATK(); updateRanking();
  });
  mwLevel.addEventListener('input', () => {
    saveStats(); updateStatTotals(); updateWATK(); updateRanking();
  });

  // Lock secondary
  lockSecCheck.addEventListener('change', () => { saveStats(); updateRanking(); });
  lockSecValue.addEventListener('input', () => { saveStats(); updateRanking(); });
  lockSecStat.addEventListener('change', () => { saveStats(); updateRanking(); });

  // Job / weapon
  jobSelect.addEventListener('change', onJobChange);
  weaponSelect.addEventListener('change', () => {
    saveStats(); updateWATK(); updateRanking();
  });

  // Equipment grid clicks
  document.querySelectorAll('.equip-slot').forEach(el => {
    el.addEventListener('click', () => onSlotClick(el.dataset.slot));
  });

  // Swap form stat input validation
  ['cur', 'tgt'].forEach(prefix => {
    STAT_KEYS.forEach(stat => {
      const input = swapInputs[prefix][stat];
      input.addEventListener('input', () => validateStatInput(input, 99));
      input.addEventListener('blur', () => clampStatOnBlur(input, 99));
    });
    swapInputs[prefix].all.addEventListener('input', () => validateStatInput(swapInputs[prefix].all, 99));
    swapInputs[prefix].all.addEventListener('blur', () => clampStatOnBlur(swapInputs[prefix].all, 99));
    swapInputs[prefix].watk.addEventListener('input', () => validateStatInput(swapInputs[prefix].watk, 999));
    swapInputs[prefix].watk.addEventListener('blur', () => clampStatOnBlur(swapInputs[prefix].watk, 999));
    swapInputs[prefix].matk.addEventListener('input', () => validateStatInput(swapInputs[prefix].matk, 999));
    swapInputs[prefix].matk.addEventListener('blur', () => clampStatOnBlur(swapInputs[prefix].matk, 999));
  });

  // All-stat toggles
  curAllstatCheck.addEventListener('change', () => {
    curStatRow.style.display = curAllstatCheck.checked ? 'none' : '';
    curAllstatRow.style.display = curAllstatCheck.checked ? '' : 'none';
  });
  tgtAllstatCheck.addEventListener('change', () => {
    tgtStatRow.style.display = tgtAllstatCheck.checked ? 'none' : '';
    tgtAllstatRow.style.display = tgtAllstatCheck.checked ? '' : 'none';
  });

  // Overall toggle
  overallCheck.addEventListener('change', () => {
    isOverallMode = overallCheck.checked;
    applyOverallMode();
    saveStats();
    updateGridDots();
    updateRanking();
    if (activeSlotId === 'top' || activeSlotId === 'overall' || activeSlotId === 'bottom') {
      const targetSlot = (activeSlotId === 'top' && isOverallMode) ? 'overall'
        : (activeSlotId === 'overall' && !isOverallMode) ? 'top'
        : activeSlotId;
      activeSlotId = null;
      onSlotClick(targetSlot);
    }
  });

  // Swap form buttons
  swapConfirmBtn.addEventListener('click', onSwapConfirm);
  swapDeleteBtn.addEventListener('click', onSwapDelete);
}

// ============================================================
// Overall mode
// ============================================================

function applyOverallMode() {
  const topSlot = document.getElementById('top-slot');
  const bottomSlot = document.getElementById('bottom-slot');

  if (isOverallMode) {
    topSlot.dataset.slot = 'overall';
    topSlot.title = '套服';
    topSlot.querySelector('.slot-icon').textContent = '👔';
    topSlot.querySelector('.slot-label').textContent = '套服';
    bottomSlot.classList.add('slot-disabled');
  } else {
    topSlot.dataset.slot = 'top';
    topSlot.title = '上衣';
    topSlot.querySelector('.slot-icon').textContent = '👕';
    topSlot.querySelector('.slot-label').textContent = '上衣';
    bottomSlot.classList.remove('slot-disabled');
  }
}

// ============================================================
// Job / Weapon
// ============================================================

function populateJobs() {
  let currentCategory = '';
  let currentGroup = null;
  jobs.forEach(j => {
    if (j.category_name !== currentCategory) {
      currentCategory = j.category_name;
      currentGroup = document.createElement('optgroup');
      currentGroup.label = currentCategory;
      jobSelect.appendChild(currentGroup);
    }
    const opt = document.createElement('option');
    opt.value = j.id;
    opt.textContent = j.name + ' (' + j.name_en + ')';
    if (j.disabled) opt.disabled = true;
    currentGroup.appendChild(opt);
  });
  jobSelect.value = 'shadower';
}

function populateWeapons(job) {
  weaponSelect.innerHTML = '';
  if (!job || job.weapons.length <= 1) {
    weaponGroup.style.display = 'none';
    if (job && job.weapons.length === 1) {
      const opt = document.createElement('option');
      opt.value = job.weapons[0].id;
      opt.textContent = job.weapons[0].name;
      weaponSelect.appendChild(opt);
    }
    return;
  }
  weaponGroup.style.display = '';
  job.weapons.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.id;
    opt.textContent = w.name + ' (' + w.name_en + ')';
    weaponSelect.appendChild(opt);
  });
}

function getSelectedJob() {
  return jobs.find(j => j.id === jobSelect.value) || null;
}

function getSelectedWeapon() {
  const job = getSelectedJob();
  if (!job || job.weapons.length === 0) return null;
  if (job.weapons.length === 1) return job.weapons[0];
  return job.weapons.find(w => w.id === weaponSelect.value) || job.weapons[0];
}

function onJobChange() {
  const job = getSelectedJob();
  populateWeapons(job);
  updateJobUI();
  updateLockSecUI();
  updateStatTotals();
  updateWATK();
  updateRanking();
  updateSwapStatColors();
  saveStats();
}

function updateJobUI() {
  const job = getSelectedJob();
  if (!job) return;
  document.querySelectorAll('.stat-label').forEach(el => el.style.opacity = '0.5');
  const mainEl = document.querySelector('.stat-label.' + job.main_stat.toLowerCase());
  if (mainEl) mainEl.style.opacity = '1';
  if (job.secondary_stat === 'STR+DEX') {
    const s = document.querySelector('.stat-label.str');
    const d = document.querySelector('.stat-label.dex');
    if (s) s.style.opacity = '0.8';
    if (d) d.style.opacity = '0.8';
  } else {
    const secEl = document.querySelector('.stat-label.' + job.secondary_stat.toLowerCase());
    if (secEl) secEl.style.opacity = '0.8';
  }
}

// ============================================================
// Color-code swap form stat inputs based on job
// ============================================================

function updateSwapStatColors() {
  const job = getSelectedJob();

  // Clear all
  ['cur', 'tgt'].forEach(prefix => {
    STAT_KEYS.forEach(stat => {
      const cell = document.getElementById(prefix + '-' + stat + '-cell');
      if (cell) {
        cell.classList.remove('stat-main', 'stat-sec');
      }
    });
  });

  if (!job) return;

  const mainStat = job.main_stat.toLowerCase();
  let secStats = [];
  if (job.secondary_stat === 'STR+DEX') {
    secStats = ['str', 'dex'];
  } else {
    secStats = [job.secondary_stat.toLowerCase()];
  }

  ['cur', 'tgt'].forEach(prefix => {
    const mainCell = document.getElementById(prefix + '-' + mainStat + '-cell');
    if (mainCell) mainCell.classList.add('stat-main');
    secStats.forEach(s => {
      const secCell = document.getElementById(prefix + '-' + s + '-cell');
      if (secCell) secCell.classList.add('stat-sec');
    });
  });
}

// ============================================================
// Stat Calculation
// ============================================================

function getBaseStats() {
  return { STR: num(strBase), DEX: num(dexBase), INT: num(intBase), LUK: num(lukBase) };
}

function getExtraStats() {
  return { STR: num(strExtra), DEX: num(dexExtra), INT: num(intExtra), LUK: num(lukExtra) };
}

function calcMWPercent() {
  if (!mwEnabled.checked) return 0;
  const level = parseInt(mwLevel.value) || 0;
  if (level <= 0) return 0;
  return Math.ceil(level / 2);
}

function calcMWBonus(bases, pct) {
  if (pct === 0) return { STR: 0, DEX: 0, INT: 0, LUK: 0 };
  return {
    STR: Math.floor(bases.STR * pct / 100),
    DEX: Math.floor(bases.DEX * pct / 100),
    INT: Math.floor(bases.INT * pct / 100),
    LUK: Math.floor(bases.LUK * pct / 100)
  };
}

function getMWBonusOnSec(job) {
  if (!mwEnabled.checked) return 0;
  const pct = calcMWPercent();
  if (pct === 0) return 0;
  const bases = getBaseStats();
  if (job.secondary_stat === 'STR+DEX') {
    return Math.floor(bases.STR * pct / 100) + Math.floor(bases.DEX * pct / 100);
  }
  return Math.floor((bases[job.secondary_stat] || 0) * pct / 100);
}

function updateLockSecUI() {
  const job = getSelectedJob();
  lockSecStat.style.display = (job && job.secondary_stat === 'STR+DEX') ? '' : 'none';
}

function getAllStatTotals() {
  const bases = getBaseStats();
  const extras = getExtraStats();
  return {
    STR: bases.STR + extras.STR,
    DEX: bases.DEX + extras.DEX,
    INT: bases.INT + extras.INT,
    LUK: bases.LUK + extras.LUK
  };
}

function updateStatTotals() {
  const bases = getBaseStats();
  const extras = getExtraStats();
  strTotal.textContent = bases.STR + extras.STR;
  dexTotal.textContent = bases.DEX + extras.DEX;
  intTotal.textContent = bases.INT + extras.INT;
  lukTotal.textContent = bases.LUK + extras.LUK;

  const mwLevelVal = parseInt(mwLevel.value) || 30;
  const mwPctDisplay = Math.ceil(mwLevelVal / 2);
  const b = mwEnabled.checked ? calcMWBonus(bases, mwPctDisplay) : { STR: 0, DEX: 0, INT: 0, LUK: 0 };
  mwInfo.innerHTML =
    '楓葉祝福 +' + mwPctDisplay + '%: ' +
    'STR <b>+' + b.STR + '</b> ｜ DEX <b>+' + b.DEX + '</b> ｜ ' +
    'INT <b>+' + b.INT + '</b> ｜ LUK <b>+' + b.LUK + '</b>';
  if (mwEnabled.checked) {
    mwInfo.removeAttribute('data-disabled');
  } else {
    mwInfo.setAttribute('data-disabled', '');
  }
}

// ============================================================
// WATK Derivation
// ============================================================

function getStatValues(job) {
  const stats = getAllStatTotals();
  const mainVal = stats[job.main_stat] || 0;
  let secVal;
  if (job.secondary_stat === 'STR+DEX') {
    secVal = stats.STR + stats.DEX;
  } else {
    secVal = stats[job.secondary_stat] || 0;
  }
  return { main: mainVal, secondary: secVal };
}

function deriveWATK() {
  const job = getSelectedJob();
  const weapon = getSelectedWeapon();
  if (!job || !weapon) return 0;
  const { main, secondary } = getStatValues(job);
  const maxAtk = num(atkMaxInput);
  const denom = main * weapon.max_multiplier + secondary;
  if (denom <= 0) return 0;
  return Math.round(maxAtk * 100 / denom);
}

function updateWATK() {
  const job = getSelectedJob();
  const weapon = getSelectedWeapon();
  if (!job || !weapon) {
    watkValue.textContent = '-';
    currentMaxAtk.textContent = '-';
    return;
  }
  const watk = deriveWATK();
  watkValue.textContent = watk;
  currentMaxAtk.textContent = num(atkMaxInput);
}

function calcMaxAtk(mainStat, secStat, weaponMult, watk) {
  return Math.floor((mainStat * weaponMult + secStat) * watk / 100);
}

// ============================================================
// Equipment slot click
// ============================================================

function onSlotClick(slotId) {
  if (slotId === 'bottom' && isOverallMode) return;

  document.querySelectorAll('.equip-slot').forEach(el => el.classList.remove('active'));
  if (activeSlotId === slotId) {
    activeSlotId = null;
    swapForm.style.display = 'none';
    swapPlaceholder.style.display = '';
    return;
  }

  activeSlotId = slotId;
  const slotEl = document.querySelector('.equip-slot[data-slot="' + slotId + '"]');
  if (slotEl) slotEl.classList.add('active');

  const slotMeta = SLOTS.find(s => s.id === slotId);
  swapFormTitle.textContent = '替換方案 — ' + (slotMeta ? slotMeta.name : slotId);

  // Show overall toggle only for top/overall/bottom
  const showOverallToggle = (slotId === 'top' || slotId === 'overall' || slotId === 'bottom');
  overallToggle.style.display = showOverallToggle ? '' : 'none';

  // Load existing plan or reset
  const plan = plans[slotId];
  if (plan) {
    loadPlanToForm(plan);
    swapDeleteBtn.style.display = '';
  } else {
    resetForm();
    swapDeleteBtn.style.display = 'none';
  }

  updateSwapStatColors();
  swapForm.style.display = '';
  swapPlaceholder.style.display = 'none';
}

function resetForm() {
  ['cur', 'tgt'].forEach(prefix => {
    STAT_KEYS.forEach(stat => { swapInputs[prefix][stat].value = '0'; });
    swapInputs[prefix].all.value = '0';
    swapInputs[prefix].watk.value = '0';
    swapInputs[prefix].matk.value = '0';
  });
  curAllstatCheck.checked = false;
  tgtAllstatCheck.checked = false;
  curStatRow.style.display = '';
  curAllstatRow.style.display = 'none';
  tgtStatRow.style.display = '';
  tgtAllstatRow.style.display = 'none';
  swapCost.value = '0';
  swapCostUnit.value = 'wan';
}

function loadPlanToForm(plan) {
  ['cur', 'tgt'].forEach(prefix => {
    const d = plan[prefix];
    if (!d) { return; }
    const isAll = d.allStat;
    const checkEl = prefix === 'cur' ? curAllstatCheck : tgtAllstatCheck;
    const statRow = prefix === 'cur' ? curStatRow : tgtStatRow;
    const allRow = prefix === 'cur' ? curAllstatRow : tgtAllstatRow;

    checkEl.checked = isAll;
    statRow.style.display = isAll ? 'none' : '';
    allRow.style.display = isAll ? '' : 'none';

    if (isAll) {
      swapInputs[prefix].all.value = d.all || 0;
    } else {
      STAT_KEYS.forEach(stat => { swapInputs[prefix][stat].value = d[stat] || 0; });
    }
    swapInputs[prefix].watk.value = d.watk || 0;
    swapInputs[prefix].matk.value = d.matk || 0;
  });
  swapCost.value = plan.cost || 0;
  swapCostUnit.value = plan.costUnit || 'wan';
}

function readFormData(prefix) {
  const checkEl = prefix === 'cur' ? curAllstatCheck : tgtAllstatCheck;
  const isAll = checkEl.checked;
  const data = { allStat: isAll, watk: intVal(swapInputs[prefix].watk), matk: intVal(swapInputs[prefix].matk) };
  if (isAll) {
    const v = intVal(swapInputs[prefix].all);
    data.all = v;
    data.str = v; data.dex = v; data.int = v; data.luk = v;
  } else {
    STAT_KEYS.forEach(stat => { data[stat] = intVal(swapInputs[prefix][stat]); });
    data.all = 0;
  }
  return data;
}

// ============================================================
// Swap plan CRUD
// ============================================================

function onSwapConfirm() {
  if (!activeSlotId) return;
  plans[activeSlotId] = {
    cur: readFormData('cur'),
    tgt: readFormData('tgt'),
    cost: num(swapCost),
    costUnit: swapCostUnit.value
  };
  savePlans();
  updateGridDots();
  updateRanking();
  swapDeleteBtn.style.display = '';
}

function onSwapDelete() {
  if (!activeSlotId) return;
  delete plans[activeSlotId];
  savePlans();
  updateGridDots();
  updateRanking();
  resetForm();
  swapDeleteBtn.style.display = 'none';
}

function updateGridDots() {
  document.querySelectorAll('.equip-slot').forEach(el => {
    const slotId = el.dataset.slot;
    const hasPlan = !!plans[slotId];
    el.classList.toggle('has-plan', hasPlan);
    let dot = el.querySelector('.plan-dot');
    if (hasPlan && !dot) {
      dot = document.createElement('span');
      dot.className = 'plan-dot';
      el.appendChild(dot);
    } else if (!hasPlan && dot) {
      dot.remove();
    }
  });
}

// ============================================================
// Ranking
// ============================================================

function getActivePlanIds() {
  return Object.keys(plans).filter(slotId => {
    if (isOverallMode && (slotId === 'top' || slotId === 'bottom')) return false;
    if (!isOverallMode && slotId === 'overall') return false;
    return true;
  });
}

function updateRanking() {
  const job = getSelectedJob();
  const weapon = getSelectedWeapon();
  if (!job || !weapon) {
    rankingArea.innerHTML = '<div class="info-box" style="text-align:center">請先選擇職業</div>';
    return;
  }

  const { main, secondary } = getStatValues(job);
  const baseWatk = deriveWATK();

  const lockEnabled = lockSecCheck.checked;
  const lockValue = lockEnabled ? num(lockSecValue) : 0;
  let baseMain = main, baseSec = secondary;
  if (lockEnabled) {
    if (job.secondary_stat === 'STR+DEX') {
      const lockStat = lockSecStat.value; // 'dex' or 'str'
      const otherStat = lockStat === 'dex' ? 'str' : 'dex';
      const stats = getAllStatTotals();
      const bases = getBaseStats();
      const mwPct = calcMWPercent();
      const mwBonusLock = mwPct > 0 ? Math.floor((bases[lockStat.toUpperCase()] || 0) * mwPct / 100) : 0;
      const lockStatTotal = stats[lockStat.toUpperCase()];
      const otherStatTotal = stats[otherStat.toUpperCase()];
      const curNoMW = lockStatTotal - mwBonusLock;
      const curExcess = Math.max(0, curNoMW - lockValue);
      baseMain = main + curExcess;
      const baseLockStat = curExcess > 0 ? lockValue + mwBonusLock : lockStatTotal;
      baseSec = baseLockStat + otherStatTotal;
    } else {
      const mwBonusSec = getMWBonusOnSec(job);
      const curSecNoMW = secondary - mwBonusSec;
      const curExcess = Math.max(0, curSecNoMW - lockValue);
      baseMain = main + curExcess;
      baseSec = curExcess > 0 ? lockValue + mwBonusSec : secondary;
    }
  }
  const baseMaxAtk = calcMaxAtk(baseMain, baseSec, weapon.max_multiplier, baseWatk);

  const planIds = getActivePlanIds();
  if (planIds.length === 0) {
    rankingArea.innerHTML = '<div class="info-box" style="text-align:center">尚無替換方案</div>';
    return;
  }

  const ranked = planIds.filter(slotId => {
    const p = plans[slotId];
    return p && p.cur && p.tgt;
  }).map(slotId => {
    const p = plans[slotId];
    const slotMeta = SLOTS.find(s => s.id === slotId);
    const cur = p.cur;
    const tgt = p.tgt;

    // Stat deltas per stat
    const delta = {};
    STAT_KEYS.forEach(stat => {
      delta[stat] = (tgt[stat] || 0) - (cur[stat] || 0);
    });

    // Map to job main/sec
    const mainStatKey = job.main_stat.toLowerCase();
    const deltaMain = delta[mainStatKey] || 0;
    let deltaSec = 0;
    if (job.secondary_stat === 'STR+DEX') {
      deltaSec = (delta.str || 0) + (delta.dex || 0);
    } else {
      deltaSec = delta[job.secondary_stat.toLowerCase()] || 0;
    }

    const deltaWatk = (slotMeta && slotMeta.hasWatk) ? ((tgt.watk || 0) - (cur.watk || 0)) : 0;

    let newMain = main + deltaMain;
    let newSec = secondary + deltaSec;
    let respecNote = null;
    let hasOverflow = false;

    if (lockEnabled) {
      if (job.secondary_stat === 'STR+DEX') {
        const lockStat = lockSecStat.value;
        const otherStat = lockStat === 'dex' ? 'str' : 'dex';
        const stats = getAllStatTotals();
        const bases = getBaseStats();
        const mwPct = calcMWPercent();
        const mwBonusLock = mwPct > 0 ? Math.floor((bases[lockStat.toUpperCase()] || 0) * mwPct / 100) : 0;
        const lockStatTotal = stats[lockStat.toUpperCase()];
        const otherStatTotal = stats[otherStat.toUpperCase()];
        const deltaLock = delta[lockStat] || 0;
        const deltaOther = delta[otherStat] || 0;

        const curNoMW = lockStatTotal - mwBonusLock;
        const newNoMW = (lockStatTotal + deltaLock) - mwBonusLock;
        const curExcess = Math.max(0, curNoMW - lockValue);
        const newExcess = Math.max(0, newNoMW - lockValue);

        newMain = main + deltaMain + newExcess;
        const effLock = newExcess > 0 ? lockValue + mwBonusLock : lockStatTotal + deltaLock;
        newSec = effLock + otherStatTotal + deltaOther;

        const additionalRespec = newExcess - curExcess;
        if (additionalRespec > 0) {
          hasOverflow = true;
          respecNote = '需要洗點(' + lockStat.toUpperCase() + '-' + additionalRespec + ')';
        }
      } else {
        const mwBonusSec = getMWBonusOnSec(job);
        const newSecNoMW = (secondary + deltaSec) - mwBonusSec;
        const curSecNoMW = secondary - mwBonusSec;
        const newExcess = Math.max(0, newSecNoMW - lockValue);
        const curExcess = Math.max(0, curSecNoMW - lockValue);

        newMain = main + deltaMain + newExcess;
        newSec = newExcess > 0 ? lockValue + mwBonusSec : secondary + deltaSec;

        const additionalRespec = newExcess - curExcess;
        if (additionalRespec > 0) {
          hasOverflow = true;
          respecNote = '需要洗點(' + job.secondary_stat + '-' + additionalRespec + ')';
        }
      }
    }

    const newWatk = baseWatk + deltaWatk;
    const newMaxAtk = calcMaxAtk(newMain, newSec, weapon.max_multiplier, newWatk);
    const deltaAtk = newMaxAtk - baseMaxAtk;

    const costInWan = p.costUnit === 'yi' ? p.cost * 10000 : p.cost;
    const costPer = deltaAtk > 0 ? costInWan / deltaAtk : Infinity;

    return {
      slotId,
      slotName: slotMeta ? slotMeta.name : slotId,
      deltaMain: newMain - baseMain,
      deltaSec: newSec - baseSec,
      deltaWatk, deltaAtk,
      costRaw: p.cost,
      costUnit: p.costUnit,
      costInWan, costPer,
      respecNote, hasOverflow
    };
  });

  ranked.sort((a, b) => a.costPer - b.costPer);

  let html = '<div class="rank-list">';
  ranked.forEach((r, i) => {
    const costPerStr = r.costPer === Infinity ? '---' : formatCost(r.costPer);
    const deltaClass = r.deltaAtk > 0 ? 'rank-delta-positive'
      : r.deltaAtk < 0 ? 'rank-delta-negative' : 'rank-delta-zero';
    const costDisplay = r.costRaw + (r.costUnit === 'yi' ? '億' : '萬');

    html += '<div class="rank-row" data-slot="' + r.slotId + '">';
    html += '<div class="rank-number">' + (i + 1) + '</div>';
    html += '<div class="rank-content">';
    html += '<div class="rank-header">';
    html += '<span class="rank-slot-name">' + r.slotName + '</span>';
    html += '<span class="rank-cost-per">' + costPerStr + ' /表攻</span>';
    html += '</div>';
    html += '<div class="rank-details">';
    html += '<span class="' + deltaClass + '">表攻 ' + (r.deltaAtk >= 0 ? '+' : '') + r.deltaAtk + '</span>';
    html += '<span>主屬 ' + (r.deltaMain >= 0 ? '+' : '') + r.deltaMain + '</span>';
    html += '<span>副屬 ' + (r.deltaSec >= 0 ? '+' : '') + r.deltaSec + '</span>';
    if (r.hasOverflow) {
      html += '<span class="rank-overflow-hint">(溢出部分已轉換)</span>';
    }
    if (r.deltaWatk !== 0) {
      html += '<span>WATK ' + (r.deltaWatk >= 0 ? '+' : '') + r.deltaWatk + '</span>';
    }
    html += '<span>成本 ' + costDisplay + '</span>';
    html += '</div>';
    if (r.respecNote) {
      html += '<div class="rank-respec-note">' + r.respecNote + '</div>';
    }
    html += '</div></div>';
  });
  html += '</div>';
  rankingArea.innerHTML = html;

  rankingArea.querySelectorAll('.rank-row').forEach(el => {
    el.addEventListener('click', () => onSlotClick(el.dataset.slot));
  });
}

function formatCost(costInWan) {
  if (costInWan >= 10000) {
    return (costInWan / 10000).toFixed(2) + '億';
  }
  if (costInWan >= 1) {
    return costInWan.toFixed(2) + '萬';
  }
  return costInWan.toFixed(4) + '萬';
}

// ============================================================
// LocalStorage
// ============================================================

function saveStats() {
  const data = {
    job: jobSelect.value,
    weapon: weaponSelect.value,
    strBase: num(strBase), strExtra: num(strExtra),
    dexBase: num(dexBase), dexExtra: num(dexExtra),
    intBase: num(intBase), intExtra: num(intExtra),
    lukBase: num(lukBase), lukExtra: num(lukExtra),
    mwEnabled: mwEnabled.checked,
    mwLevel: parseInt(mwLevel.value) || 30,
    atkMax: num(atkMaxInput),
    overallMode: isOverallMode,
    lockSec: lockSecCheck.checked,
    lockSecVal: num(lockSecValue),
    lockSecStat: lockSecStat.value
  };
  localStorage.setItem(STATS_KEY, JSON.stringify(data));
}

function loadStats() {
  const saved = JSON.parse(localStorage.getItem(STATS_KEY) || '{}');
  if (saved.job) jobSelect.value = saved.job;
  if (saved.strBase !== undefined) strBase.value = saved.strBase;
  if (saved.strExtra !== undefined) strExtra.value = saved.strExtra;
  if (saved.dexBase !== undefined) dexBase.value = saved.dexBase;
  if (saved.dexExtra !== undefined) dexExtra.value = saved.dexExtra;
  if (saved.intBase !== undefined) intBase.value = saved.intBase;
  if (saved.intExtra !== undefined) intExtra.value = saved.intExtra;
  if (saved.lukBase !== undefined) lukBase.value = saved.lukBase;
  if (saved.lukExtra !== undefined) lukExtra.value = saved.lukExtra;
  if (saved.mwEnabled !== undefined) mwEnabled.checked = saved.mwEnabled;
  if (saved.mwLevel !== undefined) mwLevel.value = saved.mwLevel;
  if (saved.atkMax !== undefined) atkMaxInput.value = saved.atkMax;
  if (saved.lockSec !== undefined) lockSecCheck.checked = saved.lockSec;
  if (saved.lockSecVal !== undefined) lockSecValue.value = saved.lockSecVal;
  if (saved.lockSecStat !== undefined) lockSecStat.value = saved.lockSecStat;
}

function savePlans() {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

function loadPlans() {
  const raw = JSON.parse(localStorage.getItem(PLANS_KEY) || '{}');
  // Migrate old format (flat curMain/curSec/...) to new format (cur/tgt objects)
  plans = {};
  Object.keys(raw).forEach(slotId => {
    const p = raw[slotId];
    if (p.cur && p.tgt) {
      plans[slotId] = p; // already new format
    } else if ('curMain' in p) {
      // Old format — discard (cannot reliably map main/sec back to STR/DEX/INT/LUK)
      // User will need to re-enter
    }
  });
}

// ============================================================
// Boot
// ============================================================

document.addEventListener('DOMContentLoaded', init);
