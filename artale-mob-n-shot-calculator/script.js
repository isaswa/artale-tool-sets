// === Constants ===
const STORAGE_KEY = 'nshot-inputs';

// === DOM references (assigned in init) ===
let strBase, strExtra, strTotal, dexBase, dexExtra, dexTotal;
let intBase, intExtra, intTotal, lukBase, lukExtra, lukTotal;
let mwEnabled, mwLevel, mwInfo;
let atkMinInput, atkMaxInput;
let watkValue, watkHint;
let jobSelect, weaponGroup, weaponSelect;
let monsterSelect, skillSelect, skillLevelInput, venomEnabledCheck, venomLevelInput;
let monsterInfo, skillInfo, venomInfo;
let buffTakoyaki, buffSnowflake, buffCustomEnabled, buffCustomWatk;
let buffedRangeValue, buffedWatkRow, buffedWatkValue;
let wipMessage, implementedArea, venomArea;
let levelUpInput;
let calculateBtn, resultsDiv;

// ============================================================
// Initialization
// ============================================================

function init() {
  // Cache DOM — stats (base + extra + total)
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

  atkMinInput = document.getElementById('atk-min');
  atkMaxInput = document.getElementById('atk-max');
  watkValue = document.getElementById('watk-value');
  watkHint = document.getElementById('watk-hint');
  jobSelect = document.getElementById('job-select');
  weaponGroup = document.getElementById('weapon-group');
  weaponSelect = document.getElementById('weapon-select');
  monsterSelect = document.getElementById('monster-select');
  skillSelect = document.getElementById('skill-select');
  skillLevelInput = document.getElementById('skill-level');
  venomEnabledCheck = document.getElementById('venom-enabled');
  venomLevelInput = document.getElementById('venom-level');
  monsterInfo = document.getElementById('monster-info');
  skillInfo = document.getElementById('skill-info');
  venomInfo = document.getElementById('venom-info');
  buffTakoyaki = document.getElementById('buff-takoyaki');
  buffSnowflake = document.getElementById('buff-snowflake');
  buffCustomEnabled = document.getElementById('buff-custom-enabled');
  buffCustomWatk = document.getElementById('buff-custom-watk');
  buffedRangeValue = document.getElementById('buffed-range-value');
  buffedWatkRow = document.getElementById('buffed-watk-row');
  buffedWatkValue = document.getElementById('buffed-watk-value');
  wipMessage = document.getElementById('wip-message');
  implementedArea = document.getElementById('implemented-area');
  venomArea = document.getElementById('venom-area');
  levelUpInput = document.getElementById('levelup-count');
  calculateBtn = document.getElementById('calculate-btn');
  resultsDiv = document.getElementById('results');

  // Populate static dropdowns
  populateJobs();
  populateMonsters();

  // Restore saved inputs (including job)
  loadFromStorage();

  // Populate weapons & skills based on restored job, then restore selections
  const job = getSelectedJob();
  populateWeapons(job);
  populateSkills(jobSelect.value);
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  if (saved.weapon) weaponSelect.value = saved.weapon;
  if (saved.skill) skillSelect.value = saved.skill;

  // Update all displays
  updateJobUI();
  updateStatTotals();
  updateWATK();
  updateBuffedRange();
  updateMonsterInfo();
  updateSkillInfo();
  updateVenomInfo();

  // Save on every input change
  const allStatInputs = [strBase, strExtra, dexBase, dexExtra, intBase, intExtra, lukBase, lukExtra];
  const allInputs = [...allStatInputs, atkMaxInput,
    skillLevelInput, venomLevelInput, buffCustomWatk, levelUpInput];
  allInputs.forEach(el => el.addEventListener('input', saveToStorage));
  jobSelect.addEventListener('change', onJobChange);
  weaponSelect.addEventListener('change', onWeaponChange);
  monsterSelect.addEventListener('change', saveToStorage);
  skillSelect.addEventListener('change', saveToStorage);
  venomEnabledCheck.addEventListener('change', saveToStorage);
  venomEnabledCheck.addEventListener('change', updateVenomInfo);
  mwEnabled.addEventListener('change', () => {
    saveToStorage();
    updateStatTotals();
    updateWATK();
    updateBuffedRange();
    updateVenomInfo();
  });
  mwLevel.addEventListener('input', () => {
    saveToStorage();
    updateStatTotals();
    updateWATK();
    updateBuffedRange();
    updateVenomInfo();
  });
  const buffCheckboxes = [buffTakoyaki, buffSnowflake, buffCustomEnabled];
  buffCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        buffCheckboxes.forEach(other => { if (other !== cb) other.checked = false; });
      }
      saveToStorage();
      updateBuffedRange();
    });
  });

  // Sanitize stat/range inputs on blur: clamp to non-negative integer
  [...allStatInputs, atkMaxInput].forEach(el =>
    el.addEventListener('blur', () => {
      el.value = Math.max(0, Math.floor(parseFloat(el.value) || 0));
      saveToStorage();
    })
  );
  // Validate skill level inputs on input
  [skillLevelInput, venomLevelInput].forEach(el =>
    el.addEventListener('input', () => validateSkillLevel(el))
  );

  // Listeners — stat changes cascade
  allStatInputs.forEach(el => {
    el.addEventListener('input', updateStatTotals);
    el.addEventListener('input', updateWATK);
    el.addEventListener('input', updateBuffedRange);
  });
  atkMaxInput.addEventListener('input', updateWATK);
  atkMaxInput.addEventListener('input', updateBuffedRange);
  buffCustomWatk.addEventListener('input', updateBuffedRange);
  // Venom depends on STR, DEX, LUK totals
  [strBase, strExtra, dexBase, dexExtra, lukBase, lukExtra].forEach(el =>
    el.addEventListener('input', updateVenomInfo)
  );
  monsterSelect.addEventListener('change', updateMonsterInfo);
  skillSelect.addEventListener('change', updateSkillInfo);
  skillLevelInput.addEventListener('input', updateSkillInfo);
  venomLevelInput.addEventListener('input', updateVenomInfo);
  calculateBtn.addEventListener('click', onCalculate);
}

// ============================================================
// Populate dropdowns
// ============================================================

function populateJobs() {
  let currentGroup = null;
  let currentCategory = '';
  jobs.forEach(j => {
    if (j.category_name !== currentCategory) {
      currentCategory = j.category_name;
      currentGroup = document.createElement('optgroup');
      currentGroup.label = currentCategory;
      jobSelect.appendChild(currentGroup);
    }
    const opt = document.createElement('option');
    opt.value = j.id;
    opt.textContent = `${j.name} (${j.name_en})`;
    if (j.disabled) opt.disabled = true;
    currentGroup.appendChild(opt);
  });
  // Default to shadower
  jobSelect.value = 'shadower';
}

function populateMonsters() {
  let currentGroup = null;
  let currentArea = '';
  monsters.forEach((m, i) => {
    if (m.area !== currentArea) {
      currentArea = m.area;
      currentGroup = document.createElement('optgroup');
      currentGroup.label = currentArea;
      monsterSelect.appendChild(currentGroup);
    }
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${m.name} [Lv.${m.level}]`;
    currentGroup.appendChild(opt);
  });
  // Default to highest level mob
  monsterSelect.value = monsters.length - 1;
}

function populateSkills(jobId) {
  skillSelect.innerHTML = '';
  skills.filter(s => s.type === 'attack' && s.job === jobId).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.name_en})`;
    skillSelect.appendChild(opt);
  });
}

// ============================================================
// Stat calculation (base + extra + MW)
// ============================================================

/** Get raw base stats from inputs */
function getBaseStats() {
  return {
    STR: num(strBase), DEX: num(dexBase), INT: num(intBase), LUK: num(lukBase)
  };
}

/** Get extra (equipment) stats from inputs */
function getExtraStats() {
  return {
    STR: num(strExtra), DEX: num(dexExtra), INT: num(intExtra), LUK: num(lukExtra)
  };
}

/** Calculate MW bonus percentage: ceil(level / 2) */
function calcMWPercent() {
  if (!mwEnabled.checked) return 0;
  const level = parseInt(mwLevel.value) || 0;
  if (level <= 0) return 0;
  return Math.ceil(level / 2);
}

/** Calculate MW bonus for each stat (based on base stats) */
function calcMWBonus(bases, pct) {
  if (pct === 0) return { STR: 0, DEX: 0, INT: 0, LUK: 0 };
  return {
    STR: Math.floor(bases.STR * pct / 100),
    DEX: Math.floor(bases.DEX * pct / 100),
    INT: Math.floor(bases.INT * pct / 100),
    LUK: Math.floor(bases.LUK * pct / 100)
  };
}

/**
 * Get total stat values. extraMainAP adds to the main stat's BASE
 * (for level-up simulation: each level = +5 AP to main stat).
 */
function getAllStatTotals(extraMainAP) {
  const bases = getBaseStats();
  const extras = getExtraStats();
  if (extraMainAP > 0) {
    const job = getSelectedJob();
    if (job) bases[job.main_stat] += extraMainAP;
  }
  const mwPct = calcMWPercent();
  const mwBonus = calcMWBonus(bases, mwPct);
  return {
    STR: bases.STR + extras.STR + mwBonus.STR,
    DEX: bases.DEX + extras.DEX + mwBonus.DEX,
    INT: bases.INT + extras.INT + mwBonus.INT,
    LUK: bases.LUK + extras.LUK + mwBonus.LUK,
    _mwBonus: mwBonus
  };
}

/** Update the displayed total for each stat + MW info */
function updateStatTotals() {
  const totals = getAllStatTotals(0);
  strTotal.textContent = totals.STR;
  dexTotal.textContent = totals.DEX;
  intTotal.textContent = totals.INT;
  lukTotal.textContent = totals.LUK;

  // MW info display
  const mwPct = calcMWPercent();
  if (mwPct > 0) {
    const b = totals._mwBonus;
    mwInfo.innerHTML =
      `楓葉祝福 +${mwPct}%: ` +
      `STR <b>+${b.STR}</b> ｜ DEX <b>+${b.DEX}</b> ｜ ` +
      `INT <b>+${b.INT}</b> ｜ LUK <b>+${b.LUK}</b>`;
  } else {
    mwInfo.innerHTML = '';
  }
}

// ============================================================
// Job helpers
// ============================================================

function getSelectedJob() {
  return jobs.find(j => j.id === jobSelect.value) || null;
}

/** Get main and secondary stat values for a given job */
function getStatValues(job, extraMainAP) {
  const stats = getAllStatTotals(extraMainAP || 0);
  const mainVal = stats[job.main_stat] || 0;
  let secVal;
  if (job.secondary_stat === 'STR+DEX') {
    secVal = stats.STR + stats.DEX;
  } else {
    secVal = stats[job.secondary_stat] || 0;
  }
  return { main: mainVal, secondary: secVal, all: stats };
}

/** Get the currently selected weapon object for the current job */
function getSelectedWeapon() {
  const job = getSelectedJob();
  if (!job || job.weapons.length === 0) return null;
  if (job.weapons.length === 1) return job.weapons[0];
  return job.weapons.find(w => w.id === weaponSelect.value) || job.weapons[0];
}

function populateWeapons(job) {
  weaponSelect.innerHTML = '';
  if (!job || job.weapons.length <= 1) {
    weaponGroup.style.display = 'none';
    return;
  }
  job.weapons.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.id;
    opt.textContent = `${w.name} (${w.name_en})`;
    weaponSelect.appendChild(opt);
  });
  weaponGroup.style.display = '';
}

function onJobChange() {
  const job = getSelectedJob();
  if (!job) return;

  populateWeapons(job);
  populateSkills(job.id);
  updateJobUI();
  updateStatTotals();
  updateWATK();
  updateBuffedRange();
  updateSkillInfo();
  updateVenomInfo();
  saveToStorage();
}

function onWeaponChange() {
  updateWatkHint();
  updateWATK();
  updateBuffedRange();
  saveToStorage();
}

function updateJobUI() {
  const job = getSelectedJob();
  if (!job) return;

  // Show/hide implemented area vs WIP message
  wipMessage.style.display = job.implemented ? 'none' : '';
  implementedArea.style.display = job.implemented ? '' : 'none';

  // Show/hide venom area (thief only)
  venomArea.style.display = job.category === 'thief' ? '' : 'none';

  updateWatkHint();
}

function updateWatkHint() {
  const job = getSelectedJob();
  const weapon = getSelectedWeapon();
  if (job && weapon) {
    const mainLabel = job.main_stat;
    const secLabel = job.secondary_stat;
    watkHint.innerHTML =
      `MAX = (${mainLabel} &times; ${weapon.max_multiplier} + ${secLabel}) &times; WATK / 100<br>` +
      `MIN = (${mainLabel} &times; ${weapon.min_multiplier} &times; 0.9 &times; mastery + ${secLabel}) &times; WATK / 100<br>` +
      `<small>${job.name} mastery = ${(job.mastery * 100).toFixed(0)}% ｜ 武器: ${weapon.name} (${weapon.name_en})</small>`;
  } else {
    watkHint.innerHTML = '<small>法師使用不同的攻擊公式</small>';
  }
}

// ============================================================
// Info displays
// ============================================================

function updateWATK() {
  const job = getSelectedJob();
  const weapon = getSelectedWeapon();
  if (!job || !weapon) {
    watkValue.textContent = '-';
    atkMinInput.value = 0;
    return;
  }

  const { main, secondary } = getStatValues(job);
  const maxAtk = num(atkMaxInput);
  const denom = main * weapon.max_multiplier + secondary;
  if (denom === 0 || maxAtk === 0) {
    watkValue.textContent = '-';
    atkMinInput.value = 0;
    return;
  }
  const watk = Math.round(maxAtk * 100 / denom);
  watkValue.textContent = watk;

  // Auto-calculate MIN from derived WATK
  const minCoeff = main * weapon.min_multiplier * 0.9 * job.mastery + secondary;
  atkMinInput.value = Math.floor(minCoeff * watk / 100);
}

/** Derive WATK from current stats + MAX input (used in level-up simulation) */
function deriveWATK() {
  const job = getSelectedJob();
  const weapon = getSelectedWeapon();
  if (!job || !weapon) return 0;
  const { main, secondary } = getStatValues(job);
  const maxAtk = num(atkMaxInput);
  const denom = main * weapon.max_multiplier + secondary;
  if (denom === 0 || maxAtk === 0) return 0;
  return Math.round(maxAtk * 100 / denom);
}

/** Calculate attack range for given stats + WATK */
function calcRangeFromWATK(job, weapon, main, secondary, watk) {
  const maxCoeff = main * weapon.max_multiplier + secondary;
  const minCoeff = main * weapon.min_multiplier * 0.9 * job.mastery + secondary;
  return {
    min: Math.floor(minCoeff * watk / 100),
    max: Math.floor(maxCoeff * watk / 100)
  };
}

function updateMonsterInfo() {
  const m = monsters[monsterSelect.value];
  if (!m) { monsterInfo.innerHTML = ''; return; }
  monsterInfo.innerHTML =
    `Lv.${m.level} ｜ HP: <b>${m.hp.toLocaleString()}</b> ｜ 物防: <b>${m.weapon_def}</b> ｜ 魔防: <b>${m.magic_def}</b>`;
}

function updateSkillInfo() {
  const skill = getSelectedAttackSkill();
  if (!skill) { skillInfo.innerHTML = ''; return; }
  if (isInvalidLevel(skillLevelInput)) { skillInfo.innerHTML = ''; return; }
  const level = clampLevel(skillLevelInput, skill);
  const pct = calcDmgPercent(skill, level);
  skillInfo.innerHTML =
    `Lv.${level}: <b>${pct}%</b> &times; ${skill.hits} hit ｜ 延遲 ${skill.latency}ms`;
}

function updateVenomInfo() {
  const enabled = venomEnabledCheck.checked;
  const level = parseInt(venomLevelInput.value) || 0;
  if (!enabled || level <= 0) {
    venomInfo.innerHTML = '<span style="color:var(--text-muted)">已停用</span>';
    return;
  }
  if (isInvalidLevel(venomLevelInput)) { venomInfo.innerHTML = ''; return; }
  const stats = getAllStatTotals(0);
  const vp = calcVenomParams(level, stats.STR, stats.DEX, stats.LUK);
  venomInfo.innerHTML =
    `Lv.${level}: 成功率 <b>${(vp.successRate * 100).toFixed(0)}%</b> ｜ ` +
    `持續 <b>${vp.duration}ms</b> ｜ 最大 <b>${vp.maxStack}</b> 層<br>` +
    `基本攻擊力: <b>${vp.basicAttack}</b> ｜ ` +
    `每層傷害: <b>${Math.floor(vp.dmgMin)}</b> ~ <b>${Math.floor(vp.dmgMax)}</b>/tick`;
}

// ============================================================
// Buff calculation
// ============================================================

function getBuffWatk() {
  let buff = 0;
  if (buffTakoyaki.checked) buff += 8;
  if (buffSnowflake.checked) buff += 20;
  if (buffCustomEnabled.checked) buff += num(buffCustomWatk);
  return buff;
}

function getBuffedRange() {
  const baseMin = num(atkMinInput);
  const baseMax = num(atkMaxInput);
  const buffWatk = getBuffWatk();
  if (buffWatk === 0) return { min: baseMin, max: baseMax };

  const job = getSelectedJob();
  const weapon = getSelectedWeapon();
  if (!job || !weapon) return { min: baseMin, max: baseMax };

  const { main, secondary } = getStatValues(job);
  const maxCoeff = main * weapon.max_multiplier + secondary;
  const minCoeff = main * weapon.min_multiplier * 0.9 * job.mastery + secondary;
  return {
    min: baseMin + Math.floor(minCoeff * buffWatk / 100),
    max: baseMax + Math.floor(maxCoeff * buffWatk / 100)
  };
}

function updateBuffedRange() {
  const range = getBuffedRange();
  buffedRangeValue.textContent = `${range.min} ~ ${range.max}`;

  // Always show buffed WATK; red when buff active
  const buffWatk = getBuffWatk();
  const baseWatk = parseInt(watkValue.textContent);
  if (!isNaN(baseWatk)) {
    buffedWatkValue.textContent = baseWatk + buffWatk;
    buffedWatkValue.style.color = buffWatk > 0 ? '#e53935' : '';
  } else {
    buffedWatkValue.textContent = '-';
    buffedWatkValue.style.color = '';
  }
}

// ============================================================
// Skill / Venom calculation helpers
// ============================================================

function calcDmgPercent(skill, level) {
  if (skill.dmg_percent === -1) return -1;
  return skill.dmg_percent.base + skill.dmg_percent.per_level * level;
}

function calcVenomParams(level, str, dex, luk) {
  const meta = skills.find(s => s.id === 'venom').metadata;
  const basicAttack = meta.basic_attack.base + meta.basic_attack.per_level * level;
  const successRate =
    (meta.success_rate.base_percent +
      meta.success_rate.per_ceil_step_percent * Math.ceil(level / meta.success_rate.ceil_divisor)) / 100;
  const duration =
    meta.duration_ms.base +
    meta.duration_ms.per_ceil_step * Math.ceil(level / meta.duration_ms.ceil_divisor);
  const maxStack = meta.max_stack;
  const tickInterval = meta.tick_interval_ms;
  const c = meta.dmg_coefficients;
  const dmgMax = (c.max_main_stat_coeff * (str + luk) + dex * c.secondary_stat_coeff) / 100 * basicAttack;
  const dmgMin = (c.min_main_stat_coeff * (str + luk) + dex * c.secondary_stat_coeff) / 100 * basicAttack;
  return { basicAttack, successRate, duration, maxStack, tickInterval, dmgMax, dmgMin };
}

// ============================================================
// Simulation
// ============================================================

/**
 * Simulate one fight and return the number of skill casts to kill the mob.
 *
 * Timeline events:
 *   - Skill casts at t = 0, latency, 2*latency, …
 *   - Venom ticks at t = 1000, 2000, 3000, …
 * Events are processed in chronological order (cast first if tied).
 */
function simulateOnce(playerMin, playerMax, monster, skillPercent, hits, latency, venomParams) {
  let hp = monster.hp;
  const wDef = monster.weapon_def;
  const pctMul = skillPercent / 100;   // e.g. 400 → 4.0

  const venomOn = venomParams !== null;

  let castCount = 0;
  let venomStacks = [];  // each entry = expiry timestamp
  let nextCast = 0;
  let nextTick = 1000;

  const MAX_ITER = 10000;
  let iter = 0;

  while (hp > 0 && iter < MAX_ITER) {
    iter++;

    // Pick next event
    if (!venomOn || nextCast <= nextTick) {
      // --- Skill cast ---
      const t = nextCast;
      castCount++;

      // Venom: each hit rolls independently, but at most 1 stack per cast
      let venomProc = false;
      for (let h = 0; h < hits; h++) {
        const atk = randInt(playerMin, playerMax);
        const dmg = Math.max(1, Math.floor((atk - 0.55 * wDef) * pctMul));
        hp -= dmg;

        if (venomOn && !venomProc && Math.random() < venomParams.successRate) {
          venomProc = true;
        }
        if (hp <= 0) break;
      }

      // Apply at most 1 venom stack per cast
      if (venomOn && venomProc) {
        pruneStacks(venomStacks, t);
        if (venomStacks.length >= venomParams.maxStack) {
          venomStacks.shift(); // drop oldest
        }
        venomStacks.push(t + venomParams.duration);
      }

      nextCast += latency;
    } else {
      // --- Venom tick ---
      const t = nextTick;
      pruneStacks(venomStacks, t);
      const stacks = venomStacks.length;
      if (stacks > 0) {
        const roll = Math.random() * (venomParams.dmgMax - venomParams.dmgMin) + venomParams.dmgMin;
        hp -= Math.max(1, Math.floor(roll * stacks));
      }
      nextTick += 1000;
    }
  }

  return castCount;
}

function runSimulation(playerMin, playerMax, monster, skill, skillLevel, venomParams) {
  const pct = calcDmgPercent(skill, skillLevel);
  const distribution = {};
  const simCount = config.simulation_count;

  for (let i = 0; i < simCount; i++) {
    const shots = simulateOnce(
      playerMin, playerMax, monster,
      pct, skill.hits, skill.latency,
      venomParams
    );
    distribution[shots] = (distribution[shots] || 0) + 1;
  }

  return distribution;
}

// ============================================================
// UI: Calculate button handler
// ============================================================

function onCalculate() {
  const { min: playerMin, max: playerMax } = getBuffedRange();
  if (playerMin <= 0 || playerMax <= 0 || playerMin > playerMax) {
    resultsDiv.innerHTML = '<p style="color:red">請輸入有效的攻擊力範圍</p>';
    return;
  }

  const monster = monsters[monsterSelect.value];
  const skill = getSelectedAttackSkill();
  const skillLevel = clampLevel(skillLevelInput, skill);

  const job = getSelectedJob();
  const weapon = getSelectedWeapon();
  const isThief = job && job.category === 'thief';
  const venomEnabled = isThief && venomEnabledCheck.checked;
  const venomLevel = parseInt(venomLevelInput.value) || 0;

  const levelUpCount = num(levelUpInput);

  // Derive WATK (constant property of the weapon, doesn't change with level)
  const watk = deriveWATK();
  const buffWatk = getBuffWatk();

  // Show loading
  calculateBtn.disabled = true;
  resultsDiv.innerHTML = '<p class="loading-text">模擬中…</p>';

  // Run async to let the UI update
  setTimeout(() => {
    const simResults = [];
    const simCount = config.simulation_count;

    for (let lv = 0; lv <= levelUpCount; lv++) {
      const extraAP = lv * 5;
      const { main, secondary, all: statTotals } = getStatValues(job, extraAP);

      // Calculate range from WATK + new stats
      let range;
      if (lv === 0) {
        // Use actual input values for current level (most accurate)
        range = { min: playerMin, max: playerMax };
      } else {
        range = calcRangeFromWATK(job, weapon, main, secondary, watk);
        // Apply buff
        if (buffWatk > 0) {
          const maxCoeff = main * weapon.max_multiplier + secondary;
          const minCoeff = main * weapon.min_multiplier * 0.9 * job.mastery + secondary;
          range.min += Math.floor(minCoeff * buffWatk / 100);
          range.max += Math.floor(maxCoeff * buffWatk / 100);
        }
      }

      // Venom params for this level's stats
      let venomParams = null;
      if (venomEnabled && venomLevel > 0) {
        venomParams = calcVenomParams(venomLevel, statTotals.STR, statTotals.DEX, statTotals.LUK);
      }

      const distribution = runSimulation(range.min, range.max, monster, skill, skillLevel, venomParams);

      // Calculate expected value
      let expected = 0;
      for (const k of Object.keys(distribution)) expected += k * distribution[k] / simCount;

      simResults.push({
        level: lv,
        mainStat: main,
        range: range,
        expected: expected,
        distribution: distribution
      });
    }

    displayResults(simResults, simCount);
    calculateBtn.disabled = false;
  }, 20);
}

// ============================================================
// Display results
// ============================================================

function displayResults(simResults, total) {
  let html = '';

  // Level-up comparison table (if more than just current level)
  if (simResults.length > 1) {
    const job = getSelectedJob();
    const mainLabel = job ? job.main_stat : '主屬';
    html += '<h3>升級比較</h3>';
    html += '<table class="levelup-table">';
    html += `<tr><th>等級</th><th>${mainLabel}</th><th>攻擊力</th><th>期望擊殺</th></tr>`;
    for (const r of simResults) {
      const cls = r.level === 0 ? ' class="current-level"' : '';
      const label = r.level === 0 ? '目前' : `+${r.level}`;
      html += `<tr${cls}>` +
        `<td>${label}</td>` +
        `<td>${r.mainStat}</td>` +
        `<td>${r.range.min}~${r.range.max}</td>` +
        `<td>${r.expected.toFixed(2)} 下</td>` +
        `</tr>`;
    }
    html += '</table>';
  }

  // Detailed distribution for current level
  const current = simResults[0];
  const distribution = current.distribution;
  const keys = Object.keys(distribution).map(Number).sort((a, b) => a - b);

  // Find max percentage for bar scaling
  let maxPct = 0;
  for (const k of keys) {
    const p = distribution[k] / total * 100;
    if (p > maxPct) maxPct = p;
  }

  html += '<h3>擊殺次數分佈</h3>';

  for (const shots of keys) {
    const count = distribution[shots];
    const pct = (count / total * 100).toFixed(2);
    const barW = (count / total * 100 / maxPct * 100).toFixed(1); // relative to max
    html +=
      `<div class="result-row">` +
        `<span class="result-label">${shots}下擊殺:</span>` +
        `<span class="result-bar-container">` +
          `<span class="result-bar" style="width:${barW}%"></span>` +
        `</span>` +
        `<span class="result-percent">${pct}%</span>` +
      `</div>`;
  }

  // Expected value
  html +=
    `<div class="result-summary">` +
      `期望值: ${current.expected.toFixed(2)} 下擊殺<br>` +
      `模擬次數: ${total.toLocaleString()}` +
    `</div>`;

  resultsDiv.innerHTML = html;
}

// ============================================================
// Utility helpers
// ============================================================

/** Parse number from input element, default 0, clamp to >= 0 integer */
function num(el) {
  return Math.max(0, Math.floor(parseFloat(el.value) || 0));
}

/** Random integer in [min, max] inclusive */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Remove expired venom stacks (expiry <= t) */
function pruneStacks(stacks, t) {
  let i = 0;
  while (i < stacks.length) {
    if (stacks[i] <= t) {
      stacks.splice(i, 1);
    } else {
      i++;
    }
  }
}

/** Get the currently selected attack skill object */
function getSelectedAttackSkill() {
  return skills.find(s => s.id === skillSelect.value) || skills.find(s => s.type === 'attack');
}

/** Clamp skill level input to valid range (for calculation only) */
function clampLevel(input, skill) {
  let v = parseInt(input.value) || skill.default_level;
  v = Math.max(skill.min_level, Math.min(skill.max_level, v));
  return v;
}

/** Check if a level input has an invalid value */
function isInvalidLevel(el) {
  const min = parseInt(el.min) || 0;
  const max = parseInt(el.max) || 30;
  const v = parseInt(el.value);
  return isNaN(v) || v < min || v > max || el.value !== String(Math.floor(v));
}

/** Show/hide validation tooltip on skill level inputs */
function validateSkillLevel(el) {
  const invalid = isInvalidLevel(el);
  const min = parseInt(el.min) || 0;
  const max = parseInt(el.max) || 30;
  el.classList.toggle('input-invalid', invalid);
  // Manage tooltip span
  let tip = el.parentElement.querySelector('.validation-tip');
  if (invalid) {
    if (!tip) {
      tip = document.createElement('span');
      tip.className = 'validation-tip';
      el.parentElement.appendChild(tip);
    }
    tip.textContent = `請輸入 ${min}~${max} 的整數`;
  } else if (tip) {
    tip.remove();
  }
}

// ============================================================
// Theme
// ============================================================

// ============================================================
// LocalStorage
// ============================================================

function saveToStorage() {
  const data = {
    job: jobSelect.value,
    weapon: weaponSelect.value,
    strBase: strBase.value,
    strExtra: strExtra.value,
    dexBase: dexBase.value,
    dexExtra: dexExtra.value,
    intBase: intBase.value,
    intExtra: intExtra.value,
    lukBase: lukBase.value,
    lukExtra: lukExtra.value,
    mwEnabled: mwEnabled.checked,
    mwLevel: mwLevel.value,
    atkMax: atkMaxInput.value,
    monster: monsterSelect.value,
    skill: skillSelect.value,
    skillLevel: skillLevelInput.value,
    venomEnabled: venomEnabledCheck.checked,
    venomLevel: venomLevelInput.value,
    buffTakoyaki: buffTakoyaki.checked,
    buffSnowflake: buffSnowflake.checked,
    buffCustomEnabled: buffCustomEnabled.checked,
    buffCustomWatk: buffCustomWatk.value,
    levelUpCount: levelUpInput.value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.job !== undefined) jobSelect.value = data.job;
    // Backward compat: old format had single str/dex/int/luk → treat as base
    if (data.strBase !== undefined) strBase.value = data.strBase;
    else if (data.str !== undefined) strBase.value = data.str;
    if (data.strExtra !== undefined) strExtra.value = data.strExtra;
    if (data.dexBase !== undefined) dexBase.value = data.dexBase;
    else if (data.dex !== undefined) dexBase.value = data.dex;
    if (data.dexExtra !== undefined) dexExtra.value = data.dexExtra;
    if (data.intBase !== undefined) intBase.value = data.intBase;
    else if (data.int !== undefined) intBase.value = data.int;
    if (data.intExtra !== undefined) intExtra.value = data.intExtra;
    if (data.lukBase !== undefined) lukBase.value = data.lukBase;
    else if (data.luk !== undefined) lukBase.value = data.luk;
    if (data.lukExtra !== undefined) lukExtra.value = data.lukExtra;
    if (data.mwEnabled !== undefined) mwEnabled.checked = data.mwEnabled;
    if (data.mwLevel !== undefined) mwLevel.value = data.mwLevel;
    if (data.atkMax !== undefined) atkMaxInput.value = data.atkMax;
    if (data.monster !== undefined) monsterSelect.value = data.monster;
    // skill is restored after populateSkills
    if (data.skillLevel !== undefined) skillLevelInput.value = data.skillLevel;
    if (data.venomEnabled !== undefined) venomEnabledCheck.checked = data.venomEnabled;
    if (data.venomLevel !== undefined) venomLevelInput.value = data.venomLevel;
    if (data.buffTakoyaki !== undefined) buffTakoyaki.checked = data.buffTakoyaki;
    if (data.buffSnowflake !== undefined) buffSnowflake.checked = data.buffSnowflake;
    if (data.buffCustomEnabled !== undefined) buffCustomEnabled.checked = data.buffCustomEnabled;
    if (data.buffCustomWatk !== undefined) buffCustomWatk.value = data.buffCustomWatk;
    if (data.levelUpCount !== undefined) levelUpInput.value = data.levelUpCount;
  } catch (e) {
    // Ignore corrupt data
  }
}

// ============================================================
// Entry point
// ============================================================
document.addEventListener('DOMContentLoaded', init);
