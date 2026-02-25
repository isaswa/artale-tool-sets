// NOTE: For any new input field with a constrained range (e.g. min/max),
// add validation + tooltip (setCustomValidity + reportValidity) on input.
// Only skip this for inputs that accept any-range numbers (e.g. EXP values).

// DOM elements - declare but don't initialize yet
let form, currentLevelInput, currentExpInput, targetLevelInput, expEfficiencyInput;
let resultsDiv, startLevelSpan, endLevelSpan, totalExpSpan, regularBonusSpan, timeNeededSpan;
let unitManBtn, unitRegularBtn;
let advancedOptions, advancedContent;
let expCouponCheckbox, couponOptions;
let customEventCheckbox, customOptions;
let enableScheduleCheckbox, scheduleContent;
let dailyAuraCheckbox, auraOptions;
let dailyGrindingInput, targetDaysInput;

// Track current mode ('simple' or 'advanced')
let currentMode = 'simple'; // Default to 簡單模式

// Track current unit mode ('man' or 'regular')
let currentUnit = 'man'; // Default to 萬 (10,000)

// Track breakdown display mode ('total' or 'daily')
let currentBreakdownMode = 'total';
// Cache simulation result for day-by-day breakdown re-rendering
let lastSimulationResult = null;
let lastCouponMultiplier = 0;
let lastAuraMultiplier = 0;
let lastCustomMultiplier = 0;

// Helper: get daily grinding minutes from HH/MM inputs (capped at 24:00)
function getDailyGrindingMinutes() {
    const hours = Math.max(0, parseInt(document.getElementById('dailyHours').value) || 0);
    const minutes = Math.max(0, parseInt(document.getElementById('dailyMinutes').value) || 0);
    return Math.min(hours * 60 + minutes, 1440);
}

// Validate and clamp HH/MM inputs so total does not exceed 24:00.
// Shows a native tooltip on the offending input if out of range.
function clampDailyTimeInputs() {
    const hoursEl = document.getElementById('dailyHours');
    const minutesEl = document.getElementById('dailyMinutes');
    let h = parseInt(hoursEl.value) || 0;
    let m = parseInt(minutesEl.value) || 0;

    // Clear previous validation
    hoursEl.setCustomValidity('');
    minutesEl.setCustomValidity('');

    if (h < 0) {
        hoursEl.setCustomValidity('小時不能小於 0');
        hoursEl.reportValidity();
        hoursEl.value = 0;
    } else if (h > 24) {
        hoursEl.setCustomValidity('小時不能超過 24');
        hoursEl.reportValidity();
        hoursEl.value = 24;
        minutesEl.value = 0;
    } else if (h === 24 && m > 0) {
        minutesEl.setCustomValidity('每日練功時間不能超過 24 小時');
        minutesEl.reportValidity();
        minutesEl.value = 0;
    }

    if (m < 0) {
        minutesEl.setCustomValidity('分鐘不能小於 0');
        minutesEl.reportValidity();
        minutesEl.value = 0;
    } else if (m > 59) {
        minutesEl.setCustomValidity('分鐘不能超過 59');
        minutesEl.reportValidity();
        minutesEl.value = 59;
    }
}

// Flag to prevent auto-save during initial page load
let isInitializing = true;

// Toggle between simple and advanced modes
function toggleMode(mode) {
    currentMode = mode;

    const modeSimpleBtn = document.getElementById('modeSimple');
    const modeAdvancedBtn = document.getElementById('modeAdvanced');

    if (mode === 'simple') {
        modeSimpleBtn.classList.add('active');
        modeAdvancedBtn.classList.remove('active');
        advancedOptions.classList.add('hidden');

        // Hide advanced-only result fields
        document.getElementById('regularBonusRow').classList.add('hidden');
        document.getElementById('eventTimeBreakdown').innerHTML = '';
        document.getElementById('eventTimeBreakdown').classList.add('hidden');
        document.getElementById('scheduleResult').classList.add('hidden');
    } else {
        modeSimpleBtn.classList.remove('active');
        modeAdvancedBtn.classList.add('active');
        advancedOptions.classList.remove('hidden');
    }

    // Save mode preference to unified storage
    saveToLocalStorage();
}

// Toggle event options
function toggleEventOptions(checkbox, optionsDiv) {
    if (checkbox.checked) {
        optionsDiv.classList.remove('hidden');
    } else {
        optionsDiv.classList.add('hidden');
    }
}

// Toggle schedule enable/disable
function toggleScheduleEnabled() {
    if (enableScheduleCheckbox.checked) {
        scheduleContent.classList.remove('hidden');
    } else {
        scheduleContent.classList.add('hidden');
        // Hide schedule result when disabled
        document.getElementById('scheduleResult').classList.add('hidden');
    }
    updateScheduleWarning();
    updateAuraWarning();
}

// Toggle schedule mode inputs
function toggleScheduleMode() {
    const scheduleMode = document.querySelector('input[name="scheduleMode"]:checked');
    if (scheduleMode && scheduleMode.value === 'daily') {
        dailyGrindingInput.classList.remove('hidden');
        targetDaysInput.classList.add('hidden');
    } else if (scheduleMode && scheduleMode.value === 'target') {
        dailyGrindingInput.classList.add('hidden');
        targetDaysInput.classList.remove('hidden');
    }
    updateScheduleWarning();
    updateAuraWarning();
}

// Update schedule input warning
function updateScheduleWarning() {
    const scheduleWarning = document.getElementById('scheduleWarning');
    const targetDaysWarning = document.getElementById('targetDaysWarning');
    if (!enableScheduleCheckbox.checked) {
        scheduleWarning.style.display = 'none';
        targetDaysWarning.style.display = 'none';
        return;
    }
    const scheduleMode = document.querySelector('input[name="scheduleMode"]:checked');
    if (scheduleMode && scheduleMode.value === 'daily') {
        const dailyMinutes = getDailyGrindingMinutes();
        scheduleWarning.style.display = dailyMinutes <= 0 ? 'block' : 'none';
        targetDaysWarning.style.display = 'none';
    } else if (scheduleMode && scheduleMode.value === 'target') {
        const targetDays = parseInt(document.getElementById('targetDays').value) || 0;
        targetDaysWarning.style.display = targetDays <= 0 ? 'block' : 'none';
        scheduleWarning.style.display = 'none';
    }
}

// Update aura warning (daily time < 1 hour)
function updateAuraWarning() {
    const auraWarning = document.getElementById('auraWarning');
    if (!auraWarning || !dailyAuraCheckbox.checked || !enableScheduleCheckbox.checked) {
        if (auraWarning) auraWarning.style.display = 'none';
        return;
    }
    const scheduleMode = document.querySelector('input[name="scheduleMode"]:checked');
    if (scheduleMode && scheduleMode.value === 'daily') {
        const dailyMinutes = getDailyGrindingMinutes();
        auraWarning.style.display = (dailyMinutes > 0 && dailyMinutes < 60) ? 'block' : 'none';
    } else {
        auraWarning.style.display = 'none';
    }
}

// Calculate regular EXP multiplier (always-on bonuses)
function calculateRegularMultiplier() {
    let multiplier = 0; // Base is 100%, we track additional %

    // Holy Symbol (無/活7/死7)
    const holySymbol = document.querySelector('input[name="holySymbol"]:checked');
    if (holySymbol) {
        if (holySymbol.value === 'alive') {
            multiplier += 50; // 活7 +50%
        } else if (holySymbol.value === 'dead') {
            multiplier += 25; // 死7 +25%
        }
        // 'none' adds 0%
    }

    // Showdown (挑釁)
    const showdown = document.querySelector('input[name="showdown"]:checked');
    if (showdown) {
        if (showdown.value === 'lv20') multiplier += 30;
        else if (showdown.value === 'lv30') multiplier += 40;
    }

    return multiplier;
}

// Calculate event EXP multiplier (coupon + custom only; aura handled separately in schedule)
function calculateEventMultiplier() {
    let multiplier = 0;

    // EXP Coupon
    if (document.getElementById('expCoupon').checked) {
        const couponType = document.querySelector('input[name="couponType"]:checked').value;
        if (couponType === '2x') {
            multiplier += 100;
        } else if (couponType === '3x') {
            multiplier += 200;
        }
    }

    return multiplier;
}

// Calculate total exp needed
function calculateExpNeeded(currentLevel, currentExp, targetLevel) {
    if (currentLevel >= targetLevel) {
        return 0;
    }

    let totalExpNeeded = 0;

    // First, calculate exp needed to complete current level (reach next level)
    // The exp needed to reach (currentLevel + 1) is stored at index currentLevel
    const expToNextLevel = expData[currentLevel].exp;
    totalExpNeeded += Math.max(0, expToNextLevel - currentExp);

    // Then, add exp needed for all levels from (currentLevel + 1) to targetLevel
    for (let level = currentLevel + 1; level < targetLevel; level++) {
        totalExpNeeded += expData[level].exp;
    }

    return totalExpNeeded;
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format time (minutes to hours and minutes)
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours > 0) {
        return `${hours} 小時 ${mins} 分鐘`;
    } else {
        return `${mins} 分鐘`;
    }
}

// Get coupon label
function getCouponLabel(multiplier) {
    if (multiplier === 100) return '2x加倍券';
    if (multiplier === 200) return '3x加倍券';
    return '加倍券';
}

// Get aura label
function getAuraLabel(multiplier) {
    if (multiplier === 100) return '2x氣場';
    if (multiplier === 200) return '3x氣場';
    return '氣場';
}

// Add breakdown item to event breakdown display
function addBreakdownItem(container, label, multiplier, timeMinutes) {
    const div = document.createElement('div');
    div.className = 'result-item';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'result-label';
    labelSpan.textContent = `└ ${label}${multiplier > 0 ? ` (+${multiplier}%)` : ''}:`;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'result-value-secondary';
    valueSpan.textContent = formatTime(timeMinutes);

    div.appendChild(labelSpan);
    div.appendChild(valueSpan);
    container.appendChild(div);
}

// Get phase display info for breakdown
function getPhaseDisplayInfo(phaseKey, couponMult, auraMult, customMult) {
    if (phaseKey === 'none') {
        return { label: '無加成', multiplier: 0 };
    }
    const parts = phaseKey.split('+');
    let totalMult = 0;
    const labels = [];

    if (parts.includes('coupon')) { labels.push(getCouponLabel(couponMult)); totalMult += couponMult; }
    if (parts.includes('custom')) { labels.push('自定義'); totalMult += customMult; }
    if (parts.includes('aura')) { labels.push(getAuraLabel(auraMult)); totalMult += auraMult; }

    return { label: labels.join('+'), multiplier: totalMult };
}

// Get phase breakdown for a specific day from simulation result
function getDayPhases(simulationResult, dayNumber) {
    const { dayDetails, identicalDayTemplate, identicalDayLastTemplate,
            noAuraDayStart, noAuraDayTemplate, noAuraDayLastTemplate, totalDays } = simulationResult;
    // Pre-optimization days: direct lookup
    if (dayNumber <= dayDetails.length) {
        return dayDetails[dayNumber - 1];
    }
    // No-aura segment (aura exhausted)
    if (noAuraDayStart && dayNumber >= noAuraDayStart) {
        if (dayNumber === totalDays && noAuraDayLastTemplate) {
            return noAuraDayLastTemplate;
        }
        return noAuraDayTemplate;
    }
    // Aura segment
    if (dayNumber === totalDays && identicalDayLastTemplate) {
        return identicalDayLastTemplate;
    }
    return identicalDayTemplate;
}

// Render phases for the currently selected day in day-by-day mode
function renderDayPhases() {
    const input = document.getElementById('breakdownDayInput');
    const container = document.getElementById('breakdownDayPhases');
    if (!input || !container || !lastSimulationResult) return;

    container.innerHTML = '';

    // Clamp value to valid range
    let dayNumber = parseInt(input.value) || 1;
    dayNumber = Math.max(1, Math.min(dayNumber, lastSimulationResult.totalDays));
    input.value = dayNumber;
    const phases = getDayPhases(lastSimulationResult, dayNumber);

    if (!phases || Object.keys(phases).length === 0) {
        const div = document.createElement('div');
        div.className = 'result-item';
        const span = document.createElement('span');
        span.className = 'result-label';
        span.textContent = '此日無練功時間';
        div.appendChild(span);
        container.appendChild(div);
        return;
    }

    const phaseOrder = ['aura+coupon+custom', 'aura+coupon', 'aura+custom',
                       'coupon+custom', 'coupon', 'custom', 'aura', 'none'];
    for (const key of phaseOrder) {
        const minutes = phases[key];
        if (!minutes || minutes < 0.01) continue;
        const info = getPhaseDisplayInfo(key, lastCouponMultiplier, lastAuraMultiplier, lastCustomMultiplier);
        addBreakdownItem(container, info.label, info.multiplier, minutes);
    }
}

// Switch breakdown display mode (total vs daily)
function switchBreakdownMode(mode) {
    currentBreakdownMode = mode;
    localStorage.setItem('artaleBreakdownMode', mode);

    document.querySelectorAll('.breakdown-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const totalContent = document.getElementById('breakdownTotalContent');
    const dailyContent = document.getElementById('breakdownDailyContent');
    if (totalContent) totalContent.classList.toggle('hidden', mode !== 'total');
    if (dailyContent) dailyContent.classList.toggle('hidden', mode !== 'daily');

    if (mode === 'daily') renderDayPhases();
}

// Render event breakdown with total/daily mode toggle
function renderEventBreakdown(eventBreakdown, simulationResult, eventPhases,
                               couponMultiplier, auraMultiplier, customMultiplier) {
    eventBreakdown.innerHTML = '';

    if (simulationResult) {
        // Cache for day selector re-rendering
        lastSimulationResult = simulationResult;
        lastCouponMultiplier = couponMultiplier;
        lastAuraMultiplier = auraMultiplier;
        lastCustomMultiplier = customMultiplier;

        // Mode toggle buttons
        const toggleDiv = document.createElement('div');
        toggleDiv.className = 'breakdown-mode-toggle';

        const totalBtn = document.createElement('button');
        totalBtn.type = 'button';
        totalBtn.className = 'breakdown-mode-btn' + (currentBreakdownMode === 'total' ? ' active' : '');
        totalBtn.textContent = '總計';
        totalBtn.dataset.mode = 'total';
        totalBtn.addEventListener('click', () => switchBreakdownMode('total'));

        const dailyBtn = document.createElement('button');
        dailyBtn.type = 'button';
        dailyBtn.className = 'breakdown-mode-btn' + (currentBreakdownMode === 'daily' ? ' active' : '');
        dailyBtn.textContent = '逐日';
        dailyBtn.dataset.mode = 'daily';
        dailyBtn.addEventListener('click', () => switchBreakdownMode('daily'));

        toggleDiv.appendChild(totalBtn);
        toggleDiv.appendChild(dailyBtn);
        eventBreakdown.appendChild(toggleDiv);

        // === Total mode content ===
        const totalContent = document.createElement('div');
        totalContent.id = 'breakdownTotalContent';
        if (currentBreakdownMode !== 'total') totalContent.classList.add('hidden');

        // Summary line
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'result-item breakdown-summary';
        const summaryLabel = document.createElement('span');
        summaryLabel.className = 'result-label';
        summaryLabel.textContent = `總共 ${simulationResult.totalDays} 天，觸發氣場 ${simulationResult.auraDaysCount} 次`;
        summaryDiv.appendChild(summaryLabel);
        totalContent.appendChild(summaryDiv);

        // Aggregated phase items
        const phaseOrder = ['aura+coupon+custom', 'aura+coupon', 'aura+custom',
                           'coupon+custom', 'coupon', 'custom', 'aura', 'none'];
        for (const key of phaseOrder) {
            const minutes = simulationResult.phases[key];
            if (!minutes || minutes < 0.01) continue;
            const info = getPhaseDisplayInfo(key, couponMultiplier, auraMultiplier, customMultiplier);
            addBreakdownItem(totalContent, info.label, info.multiplier, minutes);
        }
        eventBreakdown.appendChild(totalContent);

        // === Day-by-day mode content ===
        const dailyContent = document.createElement('div');
        dailyContent.id = 'breakdownDailyContent';
        if (currentBreakdownMode !== 'daily') dailyContent.classList.add('hidden');

        // Day selector: 第 [input] 天 / 總共 M 天 [確認]
        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'breakdown-day-selector';

        const prefixSpan = document.createElement('span');
        prefixSpan.textContent = '第';

        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'breakdownDayInput';
        input.min = 1;
        input.max = simulationResult.totalDays;
        input.value = 1;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); renderDayPhases(); }
        });

        const suffixSpan = document.createElement('span');
        suffixSpan.textContent = `天 / 總共 ${simulationResult.totalDays} 天`;

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'breakdown-confirm-btn';
        confirmBtn.textContent = '確認';
        confirmBtn.addEventListener('click', renderDayPhases);

        selectorDiv.appendChild(prefixSpan);
        selectorDiv.appendChild(input);
        selectorDiv.appendChild(suffixSpan);
        selectorDiv.appendChild(confirmBtn);
        dailyContent.appendChild(selectorDiv);

        // Day phases container
        const dayPhasesDiv = document.createElement('div');
        dayPhasesDiv.id = 'breakdownDayPhases';
        dailyContent.appendChild(dayPhasesDiv);
        eventBreakdown.appendChild(dailyContent);

        // Render initial day if in daily mode
        if (currentBreakdownMode === 'daily') renderDayPhases();

    } else {
        // Continuous mode: no toggle, render phases as before
        lastSimulationResult = null;
        eventPhases.forEach(phase => {
            if (phase.events.length === 0) {
                addBreakdownItem(eventBreakdown, '活動結束後', 0, phase.duration);
            } else {
                const labels = phase.events.map(eventName => {
                    if (eventName === 'coupon') return getCouponLabel(couponMultiplier);
                    if (eventName === 'custom') return '自定義';
                    return eventName;
                });
                const label = labels.join('+');
                addBreakdownItem(eventBreakdown, label, phase.multiplier, phase.duration);
            }
        });
    }
}

// Day-by-day simulation for schedule with daily aura
function simulateDayByDay(totalExpNeeded, baseExpPerMin, regularMultiplier,
                          auraMultiplier, globalEvents, dailyMinutes, auraTotalDays = -1, trackDayDetails = true) {
    const AURA_DAILY_MINUTES = 30;
    let remainingExp = totalExpNeeded;
    let day = 0;
    const phaseAccumulator = {};

    // Per-day tracking (only when trackDayDetails is true)
    const dayDetails = [];               // Per-day phase breakdowns
    let identicalDayStart = null;        // Day number where optimization kicks in
    let identicalDayTemplate = null;     // Phase breakdown for one identical full day
    let identicalDayLastTemplate = null; // Phase breakdown for the partial last day
    let auraDaysCount = 0;              // Number of days where aura was used

    // Deep copy global events to track remaining minutes
    const events = globalEvents.map(e => ({ ...e, remaining: e.remainingMinutes }));

    // Track where no-aura days start (for getDayPhases)
    let noAuraDayStart = null;
    let noAuraDayTemplate = null;
    let noAuraDayLastTemplate = null;

    while (remainingExp > 0.001) {
        day++;
        let dayTimeLeft = dailyMinutes;
        // Aura is available only if we haven't exhausted the finite aura days
        const auraAvailableToday = auraTotalDays === -1 || auraDaysCount < auraTotalDays;
        let dayAuraLeft = auraAvailableToday ? AURA_DAILY_MINUTES : 0;

        // Check optimization: if all global events depleted, remaining days can be fast-tracked
        const allGlobalDepleted = events.every(e => e.remaining <= 0.001);
        if (allGlobalDepleted) {
            const auraExpRate = baseExpPerMin * (100 + regularMultiplier + auraMultiplier) / (100 + regularMultiplier);
            const baseExpRate = baseExpPerMin;
            const auraTimePerDay = Math.min(AURA_DAILY_MINUTES, dailyMinutes);
            const baseTimePerDay = Math.max(0, dailyMinutes - auraTimePerDay);
            const expPerDayWithAura = (auraExpRate * auraTimePerDay) + (baseExpRate * baseTimePerDay);
            const expPerDayNoAura = baseExpRate * dailyMinutes;

            if (expPerDayWithAura <= 0 && expPerDayNoAura <= 0) break;

            // How many aura days remain?
            const auraRemainingDays = auraAvailableToday
                ? (auraTotalDays === -1 ? Infinity : auraTotalDays - auraDaysCount)
                : 0;

            if (trackDayDetails) {
                identicalDayStart = day;
                identicalDayTemplate = {};
                if (auraTimePerDay > 0.001) identicalDayTemplate['aura'] = auraTimePerDay;
                if (baseTimePerDay > 0.001) identicalDayTemplate['none'] = baseTimePerDay;
                noAuraDayTemplate = { 'none': dailyMinutes };
            }

            // === Phase 1: Days with aura ===
            if (auraRemainingDays > 0 && expPerDayWithAura > 0) {
                const fullAuraDays = Math.min(
                    Math.floor(remainingExp / expPerDayWithAura),
                    auraRemainingDays === Infinity ? Infinity : auraRemainingDays
                );
                const leftoverAfterAura = remainingExp - (fullAuraDays * expPerDayWithAura);

                if (fullAuraDays > 0) {
                    phaseAccumulator['aura'] = (phaseAccumulator['aura'] || 0) + (auraTimePerDay * fullAuraDays);
                    if (baseTimePerDay > 0) {
                        phaseAccumulator['none'] = (phaseAccumulator['none'] || 0) + (baseTimePerDay * fullAuraDays);
                    }
                    day += fullAuraDays - 1;
                    remainingExp = leftoverAfterAura;
                    auraDaysCount += fullAuraDays;
                }

                // Partial aura day (if EXP finishes mid-day or aura days run out)
                if (remainingExp > 0.001 && remainingExp < expPerDayWithAura &&
                    (auraTotalDays === -1 || auraDaysCount < auraTotalDays)) {
                    if (fullAuraDays > 0) day++;
                    const timeInAura = Math.min(auraTimePerDay, remainingExp / auraExpRate);
                    phaseAccumulator['aura'] = (phaseAccumulator['aura'] || 0) + timeInAura;
                    remainingExp -= auraExpRate * timeInAura;

                    if (trackDayDetails) {
                        identicalDayLastTemplate = {};
                        if (timeInAura > 0.001) identicalDayLastTemplate['aura'] = timeInAura;
                    }

                    if (remainingExp > 0.001 && baseTimePerDay > 0) {
                        const timeInBase = Math.min(baseTimePerDay, remainingExp / baseExpRate);
                        phaseAccumulator['none'] = (phaseAccumulator['none'] || 0) + timeInBase;
                        if (trackDayDetails && timeInBase > 0.001) {
                            identicalDayLastTemplate['none'] = timeInBase;
                        }
                        remainingExp -= baseExpRate * timeInBase;
                    }
                    auraDaysCount++;
                    if (remainingExp <= 0.001) { remainingExp = 0; break; }
                }
            }

            // === Phase 2: Days without aura (aura exhausted) ===
            if (remainingExp > 0.001 && expPerDayNoAura > 0) {
                if (trackDayDetails) {
                    noAuraDayStart = day + 1;
                }
                const fullNoAuraDays = Math.floor(remainingExp / expPerDayNoAura);
                const leftoverNoAura = remainingExp - (fullNoAuraDays * expPerDayNoAura);

                if (fullNoAuraDays > 0) {
                    phaseAccumulator['none'] = (phaseAccumulator['none'] || 0) + (dailyMinutes * fullNoAuraDays);
                    day += fullNoAuraDays;
                    remainingExp = leftoverNoAura;
                }

                // Partial last day without aura
                if (remainingExp > 0.001) {
                    day++;
                    const timeInBase = Math.min(dailyMinutes, remainingExp / baseExpRate);
                    phaseAccumulator['none'] = (phaseAccumulator['none'] || 0) + timeInBase;

                    if (trackDayDetails) {
                        noAuraDayLastTemplate = { 'none': timeInBase };
                    }
                    remainingExp = 0;
                }
            }
            break;
        }

        // Normal day simulation: grind phases in priority order (highest multiplier first)
        const dayPhases = trackDayDetails ? {} : null;
        while (dayTimeLeft > 0.001 && remainingExp > 0.001) {
            const availableCoupon = events.find(e => e.name === 'coupon' && e.remaining > 0.001);
            const availableCustom = events.find(e => e.name === 'custom' && e.remaining > 0.001);
            const auraAvailable = dayAuraLeft > 0.001;

            // Build all possible combos and pick highest multiplier
            const combos = [];

            if (availableCoupon && availableCustom && auraAvailable) {
                combos.push({
                    events: ['coupon', 'custom', 'aura'],
                    duration: Math.min(dayTimeLeft, availableCoupon.remaining, availableCustom.remaining, dayAuraLeft),
                    multiplier: availableCoupon.multiplier + availableCustom.multiplier + auraMultiplier
                });
            }
            if (availableCoupon && auraAvailable) {
                combos.push({
                    events: ['coupon', 'aura'],
                    duration: Math.min(dayTimeLeft, availableCoupon.remaining, dayAuraLeft),
                    multiplier: availableCoupon.multiplier + auraMultiplier
                });
            }
            if (availableCustom && auraAvailable) {
                combos.push({
                    events: ['custom', 'aura'],
                    duration: Math.min(dayTimeLeft, availableCustom.remaining, dayAuraLeft),
                    multiplier: availableCustom.multiplier + auraMultiplier
                });
            }
            if (availableCoupon && availableCustom) {
                combos.push({
                    events: ['coupon', 'custom'],
                    duration: Math.min(dayTimeLeft, availableCoupon.remaining, availableCustom.remaining),
                    multiplier: availableCoupon.multiplier + availableCustom.multiplier
                });
            }
            if (availableCoupon) {
                combos.push({
                    events: ['coupon'],
                    duration: Math.min(dayTimeLeft, availableCoupon.remaining),
                    multiplier: availableCoupon.multiplier
                });
            }
            if (availableCustom) {
                combos.push({
                    events: ['custom'],
                    duration: Math.min(dayTimeLeft, availableCustom.remaining),
                    multiplier: availableCustom.multiplier
                });
            }
            if (auraAvailable) {
                combos.push({
                    events: ['aura'],
                    duration: Math.min(dayTimeLeft, dayAuraLeft),
                    multiplier: auraMultiplier
                });
            }
            // Base (no bonus)
            combos.push({ events: [], duration: dayTimeLeft, multiplier: 0 });

            // Sort by multiplier descending
            combos.sort((a, b) => b.multiplier - a.multiplier);
            const best = combos[0];

            // Calculate EXP rate for this phase
            const expRate = baseExpPerMin * (100 + regularMultiplier + best.multiplier) / (100 + regularMultiplier);
            const timeToFinish = remainingExp / expRate;
            const actualDuration = Math.min(best.duration, timeToFinish);

            // Build phase key
            const phaseKey = best.events.length > 0 ? best.events.sort().join('+') : 'none';
            phaseAccumulator[phaseKey] = (phaseAccumulator[phaseKey] || 0) + actualDuration;
            if (dayPhases) dayPhases[phaseKey] = (dayPhases[phaseKey] || 0) + actualDuration;

            // Deduct resources
            remainingExp -= expRate * actualDuration;
            dayTimeLeft -= actualDuration;

            if (best.events.includes('aura')) dayAuraLeft -= actualDuration;
            if (best.events.includes('coupon') && availableCoupon) availableCoupon.remaining -= actualDuration;
            if (best.events.includes('custom') && availableCustom) availableCustom.remaining -= actualDuration;
        }

        // Track aura usage for this day
        if ((AURA_DAILY_MINUTES - dayAuraLeft) > 0.001) auraDaysCount++;

        // Track per-day data
        if (dayPhases) {
            dayDetails.push(dayPhases);
        }

        // Safety valve
        if (day > 100000) break;
    }

    const totalGrindingMinutes = Object.values(phaseAccumulator).reduce((s, v) => s + v, 0);
    return {
        totalDays: day, phases: phaseAccumulator, totalGrindingMinutes,
        dayDetails, identicalDayStart, identicalDayTemplate, identicalDayLastTemplate,
        noAuraDayStart, noAuraDayTemplate, noAuraDayLastTemplate, auraDaysCount
    };
}

// Binary search for daily time that completes in target days (with aura)
function findDailyTimeForTargetDays(totalExpNeeded, baseExpPerMin, regularMultiplier,
                                     auraMultiplier, globalEvents, targetDays, auraTotalDays = -1) {
    let lo = 1;
    let hi = 24 * 60;

    for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;
        const result = simulateDayByDay(
            totalExpNeeded, baseExpPerMin, regularMultiplier,
            auraMultiplier, globalEvents.map(e => ({ ...e })), mid, auraTotalDays, false
        );
        if (result.totalDays <= targetDays) {
            hi = mid;
        } else {
            lo = mid;
        }
    }

    return hi;
}

// Calculate and display results
function calculateResults(e) {
    e.preventDefault();

    // Clear any previous custom validation messages
    currentLevelInput.setCustomValidity('');
    currentExpInput.setCustomValidity('');
    targetLevelInput.setCustomValidity('');
    expEfficiencyInput.setCustomValidity('');

    const currentLevel = parseInt(currentLevelInput.value);
    const currentExp = parseInt(currentExpInput.value);
    const targetLevel = parseInt(targetLevelInput.value);
    const expEfficiency = parseInt(expEfficiencyInput.value);

    // Validation
    if (currentLevel < 1 || currentLevel > 200) {
        currentLevelInput.setCustomValidity('現在等級必須在 1 到 200 之間');
        currentLevelInput.reportValidity();
        return;
    }

    if (targetLevel < 1 || targetLevel > 200) {
        targetLevelInput.setCustomValidity('目標等級必須在 1 到 200 之間');
        targetLevelInput.reportValidity();
        return;
    }

    if (currentLevel >= targetLevel) {
        targetLevelInput.setCustomValidity('目標等級必須大於現在等級');
        targetLevelInput.reportValidity();
        return;
    }

    if (currentExp < 0) {
        currentExpInput.setCustomValidity('現在EXP不能小於 0');
        currentExpInput.reportValidity();
        return;
    }

    // Validate current exp is less than exp needed to level up
    if (currentLevel < 200) {
        const expNeededForNextLevel = expData[currentLevel].exp;
        if (currentExp >= expNeededForNextLevel) {
            currentExpInput.setCustomValidity(`現在EXP必須小於 ${formatNumber(expNeededForNextLevel)} (等級 ${currentLevel + 1} 所需經驗值)`);
            currentExpInput.reportValidity();
            return;
        }
    }

    if (expEfficiency <= 0) {
        expEfficiencyInput.setCustomValidity('經驗效率必須大於 0');
        expEfficiencyInput.reportValidity();
        return;
    }

    // Calculate total exp needed
    const totalExpNeeded = calculateExpNeeded(currentLevel, currentExp, targetLevel);

    // Convert exp efficiency based on current unit
    // If unit is 萬, multiply by 10,000
    // Note: This input already includes regular buffs (Holy Symbol, Showdown, etc.)
    const baseExpEfficiency = currentUnit === 'man' ? expEfficiency * 10000 : expEfficiency;

    // Calculate regular multiplier
    const regularMultiplier = calculateRegularMultiplier(); // For display only

    // The input already includes regular buffs, so we use it directly
    const regularExpPerTenMin = baseExpEfficiency;

    // Get event details
    const hasCoupon = document.getElementById('expCoupon').checked;
    const hasCustom = document.getElementById('customEvent').checked;

    let couponMinutes = 0;
    let customMinutes = 0;
    let couponMultiplier = 0;
    let customMultiplier = 0;

    if (hasCoupon) {
        const couponCount = parseInt(document.getElementById('couponCount').value);
        couponMinutes = couponCount === -1 ? Infinity : couponCount * 30;
        const couponType = document.querySelector('input[name="couponType"]:checked').value;
        couponMultiplier = couponType === '2x' ? 100 : 200;
    }

    if (hasCustom) {
        const customDuration = parseInt(document.getElementById('customDuration').value);
        customMinutes = customDuration === -1 ? Infinity : customDuration;
        customMultiplier = parseInt(document.getElementById('customBonus').value);
    }

    // Get aura details (in schedule section)
    const hasAura = dailyAuraCheckbox.checked && enableScheduleCheckbox.checked;
    let auraMultiplier = 0;
    let auraTotalDays = -1; // -1 = unlimited
    if (hasAura) {
        const auraType = document.querySelector('input[name="auraType"]:checked').value;
        auraMultiplier = auraType === '2x' ? 100 : 200;
        auraTotalDays = parseInt(document.getElementById('auraDays').value) || -1;
    }

    // Determine if schedule is enabled and has valid input
    const isScheduleEnabled = enableScheduleCheckbox.checked;
    const scheduleMode = document.querySelector('input[name="scheduleMode"]:checked');
    let scheduleDailyMinutes = 0;
    let scheduleTargetDays = 0;

    if (currentMode === 'advanced' && isScheduleEnabled && scheduleMode) {
        if (scheduleMode.value === 'daily') {
            scheduleDailyMinutes = getDailyGrindingMinutes();
        } else if (scheduleMode.value === 'target') {
            scheduleTargetDays = parseInt(document.getElementById('targetDays').value) || 0;
        }
    }

    const useAuraSimulation = hasAura && (scheduleDailyMinutes > 0 || scheduleTargetDays > 0);

    // Build list of active events (coupon + custom only; aura handled in simulation)
    const activeEvents = [];
    if (hasCoupon) activeEvents.push({ name: 'coupon', duration: couponMinutes, multiplier: couponMultiplier });
    if (hasCustom) activeEvents.push({ name: 'custom', duration: customMinutes, multiplier: customMultiplier });

    let eventPhases = [];
    let totalTimeMinutes = 0;
    let simulationResult = null;

    if (useAuraSimulation) {
        // Day-by-day simulation path (aura + schedule)
        const globalEvents = [];
        if (hasCoupon) globalEvents.push({ name: 'coupon', remainingMinutes: couponMinutes, multiplier: couponMultiplier });
        if (hasCustom) globalEvents.push({ name: 'custom', remainingMinutes: customMinutes, multiplier: customMultiplier });

        if (scheduleDailyMinutes > 0) {
            simulationResult = simulateDayByDay(
                totalExpNeeded, baseExpEfficiency / 10, regularMultiplier,
                auraMultiplier, globalEvents, scheduleDailyMinutes, auraTotalDays
            );
            totalTimeMinutes = simulationResult.totalGrindingMinutes;
        } else if (scheduleTargetDays > 0) {
            const optimalDailyMinutes = findDailyTimeForTargetDays(
                totalExpNeeded, baseExpEfficiency / 10, regularMultiplier,
                auraMultiplier, globalEvents, scheduleTargetDays, auraTotalDays
            );
            simulationResult = simulateDayByDay(
                totalExpNeeded, baseExpEfficiency / 10, regularMultiplier,
                auraMultiplier, globalEvents.map(e => ({ ...e })), optimalDailyMinutes, auraTotalDays
            );
            simulationResult._computedDailyMinutes = optimalDailyMinutes;
            totalTimeMinutes = simulationResult.totalGrindingMinutes;
        }
    } else {
        // Continuous calculation path (no aura, existing logic)
        let remainingExp = totalExpNeeded;

        if (activeEvents.length > 0) {
            let currentTime = 0;
            let currentEvents = [...activeEvents];

            while (currentEvents.length > 0 && remainingExp > 0) {
                const totalEventMultiplier = currentEvents.reduce((sum, e) => sum + e.multiplier, 0);
                const expRate = baseExpEfficiency * (100 + regularMultiplier + totalEventMultiplier) / (100 + regularMultiplier);
                const expPerMinute = expRate / 10;

                const nextExpiration = Math.min(...currentEvents.map(e => e.duration));
                const phaseDuration = nextExpiration - currentTime;
                const expInPhase = expPerMinute * phaseDuration;

                if (expInPhase >= remainingExp) {
                    eventPhases.push({
                        events: currentEvents.map(e => e.name),
                        multiplier: totalEventMultiplier,
                        duration: remainingExp / expPerMinute
                    });
                    remainingExp = 0;
                    break;
                } else {
                    eventPhases.push({
                        events: currentEvents.map(e => e.name),
                        multiplier: totalEventMultiplier,
                        duration: phaseDuration
                    });
                    remainingExp -= expInPhase;
                    currentTime = nextExpiration;
                    currentEvents = currentEvents.filter(e => e.duration > currentTime);
                }
            }
        }

        if (remainingExp > 0) {
            const expPerMinute = regularExpPerTenMin / 10;
            eventPhases.push({
                events: [],
                multiplier: 0,
                duration: remainingExp / expPerMinute
            });
        }

        totalTimeMinutes = eventPhases.reduce((sum, phase) => sum + phase.duration, 0);
    }

    const hasEvents = hasCoupon || hasCustom || hasAura;

    // Calculate percentage of current level progress
    let expPercentage = 0;
    if (currentLevel < 200) {
        const expNeededForNextLevel = expData[currentLevel].exp;
        expPercentage = (currentExp / expNeededForNextLevel) * 100;
    }

    // Display results
    startLevelSpan.textContent = `${currentLevel} (${formatNumber(currentExp)} [${expPercentage.toFixed(2)}%])`;
    endLevelSpan.textContent = `${targetLevel}`;
    totalExpSpan.textContent = formatNumber(totalExpNeeded);
    timeNeededSpan.textContent = formatTime(totalTimeMinutes);

    // Show/hide next level sub-rows (only when target is 2+ levels above current)
    const nextLevelExpItem = document.getElementById('nextLevelExpItem');
    const nextLevelTimeItem = document.getElementById('nextLevelTimeItem');
    const totalExpRow = document.getElementById('totalExpRow');
    const timeNeededRow = timeNeededSpan.closest('.result-item');
    if (targetLevel - currentLevel >= 2) {
        const expToNextLevel = expData[currentLevel].exp - currentExp;
        const nextLevelMinutes = totalTimeMinutes * (expToNextLevel / totalExpNeeded);
        const nextLevelLabel = `到下個等級(Lv.${currentLevel + 1}):`;

        nextLevelExpItem.querySelector('.result-label').textContent = nextLevelLabel;
        document.getElementById('nextLevelExp').textContent = formatNumber(expToNextLevel);
        nextLevelExpItem.classList.remove('hidden');
        totalExpRow.classList.add('has-sub');

        nextLevelTimeItem.querySelector('.result-label').textContent = nextLevelLabel;
        document.getElementById('nextLevelTime').textContent = formatTime(nextLevelMinutes);
        nextLevelTimeItem.classList.remove('hidden');
        timeNeededRow.classList.add('has-sub');
    } else {
        nextLevelExpItem.classList.add('hidden');
        totalExpRow.classList.remove('has-sub');
        nextLevelTimeItem.classList.add('hidden');
        timeNeededRow.classList.remove('has-sub');
    }

    // Show/hide advanced-only result fields based on mode
    const regularBonusRow = document.getElementById('regularBonusRow');
    if (currentMode === 'simple') {
        regularBonusRow.classList.add('hidden');
    } else {
        regularBonusRow.classList.remove('hidden');
        document.getElementById('regularBonus').textContent = `+${regularMultiplier}%`;
    }

    // Show/hide event breakdown with detailed phases (only in advanced mode)
    const eventBreakdown = document.getElementById('eventTimeBreakdown');
    if (currentMode === 'advanced' && hasEvents) {
        renderEventBreakdown(eventBreakdown, simulationResult, eventPhases,
                             couponMultiplier, auraMultiplier, customMultiplier);
        eventBreakdown.classList.remove('hidden');
    } else {
        eventBreakdown.innerHTML = '';
        eventBreakdown.classList.add('hidden');
        lastSimulationResult = null;
    }

    // Display schedule result
    const scheduleResultDiv = document.getElementById('scheduleResult');
    const scheduleLabelEl = document.getElementById('scheduleLabel');
    const scheduleValueEl = document.getElementById('scheduleValue');

    if (currentMode === 'advanced' && isScheduleEnabled && scheduleMode) {
        if (simulationResult) {
            // Simulation path: use simulation result for schedule display
            if (scheduleMode.value === 'daily' && scheduleDailyMinutes > 0) {
                scheduleLabelEl.textContent = '所需天數:';
                scheduleValueEl.textContent = `${simulationResult.totalDays} 天 (每日 ${formatTime(scheduleDailyMinutes)})`;
                scheduleResultDiv.classList.remove('hidden');
            } else if (scheduleMode.value === 'target' && scheduleTargetDays > 0) {
                const computedMinutes = Math.ceil(simulationResult._computedDailyMinutes);
                scheduleLabelEl.textContent = '每日所需時間:';
                scheduleValueEl.textContent = `${formatTime(computedMinutes)} (共 ${scheduleTargetDays} 天)`;
                scheduleResultDiv.classList.remove('hidden');
            } else {
                scheduleResultDiv.classList.add('hidden');
            }
        } else if (scheduleMode.value === 'daily') {
            // Non-simulation: simple division
            const dailyMinutes = getDailyGrindingMinutes();
            if (dailyMinutes > 0) {
                const daysRequired = Math.ceil(totalTimeMinutes / dailyMinutes);
                scheduleLabelEl.textContent = '所需天數:';
                scheduleValueEl.textContent = `${daysRequired} 天 (每日 ${formatTime(dailyMinutes)})`;
                scheduleResultDiv.classList.remove('hidden');
            } else {
                scheduleResultDiv.classList.add('hidden');
            }
        } else if (scheduleMode.value === 'target') {
            const targetDaysVal = parseInt(document.getElementById('targetDays').value) || 0;
            if (targetDaysVal > 0) {
                const minutesPerDay = Math.ceil(totalTimeMinutes / targetDaysVal);
                scheduleLabelEl.textContent = '每日所需時間:';
                scheduleValueEl.textContent = `${formatTime(minutesPerDay)} (共 ${targetDaysVal} 天)`;
                scheduleResultDiv.classList.remove('hidden');
            } else {
                scheduleResultDiv.classList.add('hidden');
            }
        } else {
            scheduleResultDiv.classList.add('hidden');
        }
    } else {
        scheduleResultDiv.classList.add('hidden');
    }

    resultsDiv.classList.remove('hidden');

    // Save to localStorage
    saveToLocalStorage();
}

// Toggle unit mode
function toggleUnit(unit) {
    currentUnit = unit;

    if (unit === 'man') {
        unitManBtn.classList.add('active');
        unitRegularBtn.classList.remove('active');
        expEfficiencyInput.placeholder = '輸入每10分鐘獲得的經驗值 (萬)';
    } else {
        unitManBtn.classList.remove('active');
        unitRegularBtn.classList.add('active');
        expEfficiencyInput.placeholder = '輸入每10分鐘獲得的經驗值';
    }

    // Save unit preference
    localStorage.setItem('expUnit', unit);
}

// Save form values to localStorage
function saveToLocalStorage() {
    // Don't save during initialization to prevent overwriting saved data with empty values
    if (isInitializing) {
        return;
    }

    // Get Holy Symbol value
    const holySymbol = document.querySelector('input[name="holySymbol"]:checked');

    // Get coupon type value
    const couponType = document.querySelector('input[name="couponType"]:checked');

    // Get aura type value
    const auraType = document.querySelector('input[name="auraType"]:checked');

    // Get schedule mode value
    const scheduleMode = document.querySelector('input[name="scheduleMode"]:checked');

    const formData = {
        mode: currentMode,
        currentLevel: currentLevelInput.value,
        currentExp: currentExpInput.value,
        targetLevel: targetLevelInput.value,
        expEfficiency: expEfficiencyInput.value,
        unit: currentUnit,
        // Advanced options - regular buffs
        holySymbol: holySymbol ? holySymbol.value : 'none',
        showdown: (document.querySelector('input[name="showdown"]:checked') || {}).value || 'none',
        // Advanced options - events
        expCoupon: document.getElementById('expCoupon').checked,
        couponType: couponType ? couponType.value : '2x',
        couponCount: document.getElementById('couponCount').value,
        customEvent: document.getElementById('customEvent').checked,
        customBonus: document.getElementById('customBonus').value,
        customDuration: document.getElementById('customDuration').value,
        // Advanced options - grinding schedule
        enableSchedule: enableScheduleCheckbox.checked,
        scheduleMode: scheduleMode ? scheduleMode.value : 'daily',
        dailyHours: document.getElementById('dailyHours').value,
        dailyMinutes: document.getElementById('dailyMinutes').value,
        targetDays: document.getElementById('targetDays').value,
        dailyAura: dailyAuraCheckbox.checked,
        auraType: auraType ? auraType.value : '2x',
        auraDays: document.getElementById('auraDays').value
    };

    localStorage.setItem('artaleCalcData', JSON.stringify(formData));
}

// Load form values from localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('artaleCalcData');

    if (savedData) {
        try {
            const formData = JSON.parse(savedData);

            // Mode
            if (formData.mode !== undefined) {
                toggleMode(formData.mode);
            }

            // Basic inputs
            if (formData.currentLevel) currentLevelInput.value = formData.currentLevel;
            if (formData.currentExp) currentExpInput.value = formData.currentExp;
            if (formData.targetLevel) targetLevelInput.value = formData.targetLevel;
            if (formData.expEfficiency) expEfficiencyInput.value = formData.expEfficiency;
            if (formData.unit) toggleUnit(formData.unit);

            // Advanced options - regular buffs
            if (formData.holySymbol !== undefined) {
                const holySymbolRadio = document.querySelector(`input[name="holySymbol"][value="${formData.holySymbol}"]`);
                if (holySymbolRadio) holySymbolRadio.checked = true;
            }

            if (formData.showdown) {
                const showdownRadio = document.querySelector(`input[name="showdown"][value="${formData.showdown}"]`);
                if (showdownRadio) showdownRadio.checked = true;
            } else if (formData.tauntBuff !== undefined) {
                // Backward compatibility: old data used tauntBuff boolean
                const val = formData.tauntBuff ? 'lv20' : 'none';
                const showdownRadio = document.querySelector(`input[name="showdown"][value="${val}"]`);
                if (showdownRadio) showdownRadio.checked = true;
            }

            // Advanced options - events
            if (formData.expCoupon !== undefined) {
                const expCouponCheckbox = document.getElementById('expCoupon');
                expCouponCheckbox.checked = formData.expCoupon;
                toggleEventOptions(expCouponCheckbox, couponOptions);
            }

            if (formData.couponType !== undefined) {
                const couponTypeRadio = document.querySelector(`input[name="couponType"][value="${formData.couponType}"]`);
                if (couponTypeRadio) couponTypeRadio.checked = true;
            }

            if (formData.couponCount !== undefined) {
                document.getElementById('couponCount').value = formData.couponCount;
            }

            if (formData.customEvent !== undefined) {
                const customEventCheckbox = document.getElementById('customEvent');
                customEventCheckbox.checked = formData.customEvent;
                toggleEventOptions(customEventCheckbox, customOptions);
            }

            if (formData.customBonus !== undefined) {
                document.getElementById('customBonus').value = formData.customBonus;
            }

            if (formData.customDuration !== undefined) {
                document.getElementById('customDuration').value = formData.customDuration;
            }

            // Advanced options - grinding schedule
            // Backward compatibility: migrate old weatherEvent to dailyAura
            if (formData.weatherEvent !== undefined && formData.dailyAura === undefined) {
                formData.dailyAura = formData.weatherEvent;
                formData.auraType = formData.weatherType || '2x';
            }

            // Load input values FIRST (before toggles that depend on them)
            // Backward compatibility: migrate old dailyTime + timeUnit to dailyHours/dailyMinutes
            if (formData.dailyTime !== undefined && formData.dailyHours === undefined) {
                const oldTime = parseFloat(formData.dailyTime) || 0;
                const oldUnit = formData.timeUnit || 'hour';
                const totalMinutes = oldUnit === 'hour' ? Math.round(oldTime * 60) : Math.round(oldTime);
                formData.dailyHours = String(Math.floor(totalMinutes / 60));
                formData.dailyMinutes = String(totalMinutes % 60);
            }

            if (formData.dailyHours !== undefined) {
                document.getElementById('dailyHours').value = formData.dailyHours;
            }
            if (formData.dailyMinutes !== undefined) {
                document.getElementById('dailyMinutes').value = formData.dailyMinutes;
            }

            if (formData.targetDays !== undefined) {
                document.getElementById('targetDays').value = formData.targetDays;
            }

            // Daily aura
            if (formData.dailyAura !== undefined) {
                dailyAuraCheckbox.checked = formData.dailyAura;
                toggleEventOptions(dailyAuraCheckbox, auraOptions);
            }

            if (formData.auraType !== undefined) {
                const auraTypeRadio = document.querySelector(`input[name="auraType"][value="${formData.auraType}"]`);
                if (auraTypeRadio) auraTypeRadio.checked = true;
            }

            if (formData.auraDays !== undefined) {
                document.getElementById('auraDays').value = formData.auraDays;
            }

            // Now apply toggles (which depend on loaded values for warning checks)
            if (formData.enableSchedule !== undefined) {
                enableScheduleCheckbox.checked = formData.enableSchedule;
                toggleScheduleEnabled();
            }

            if (formData.scheduleMode !== undefined) {
                const scheduleModeRadio = document.querySelector(`input[name="scheduleMode"][value="${formData.scheduleMode}"]`);
                if (scheduleModeRadio) {
                    scheduleModeRadio.checked = true;
                    toggleScheduleMode();
                }
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}


// Initialize event listeners
function initEventListeners() {
    // Form submit
    form.addEventListener('submit', calculateResults);
    unitManBtn.addEventListener('click', () => toggleUnit('man'));
    unitRegularBtn.addEventListener('click', () => toggleUnit('regular'));

    // Mode toggle event listeners
    document.getElementById('modeSimple').addEventListener('click', () => toggleMode('simple'));
    document.getElementById('modeAdvanced').addEventListener('click', () => toggleMode('advanced'));

    // Advanced options collapsible toggle
    document.getElementById('advancedOptionsToggle').addEventListener('click', () => {
        const header = document.getElementById('advancedOptionsToggle');
        const content = document.getElementById('advancedContent');
        const collapsed = !header.classList.contains('collapsed');
        header.classList.toggle('collapsed', collapsed);
        content.classList.toggle('hidden', collapsed);
        localStorage.setItem('artaleAdvancedCollapsed', collapsed ? 'true' : 'false');
    });

    // Advanced options event listeners
    expCouponCheckbox.addEventListener('change', () => {
        toggleEventOptions(expCouponCheckbox, couponOptions);
    });

    customEventCheckbox.addEventListener('change', () => {
        toggleEventOptions(customEventCheckbox, customOptions);
    });

    // Clear custom validation messages when user types
    currentLevelInput.addEventListener('input', () => currentLevelInput.setCustomValidity(''));
    currentExpInput.addEventListener('input', () => currentExpInput.setCustomValidity(''));
    targetLevelInput.addEventListener('input', () => targetLevelInput.setCustomValidity(''));
    expEfficiencyInput.addEventListener('input', () => expEfficiencyInput.setCustomValidity(''));

    // Save to localStorage when advanced options change
    // Holy Symbol radio buttons
    document.querySelectorAll('input[name="holySymbol"]').forEach(radio => {
        radio.addEventListener('change', saveToLocalStorage);
    });

    // Showdown radio buttons
    document.querySelectorAll('input[name="showdown"]').forEach(radio => {
        radio.addEventListener('change', saveToLocalStorage);
    });

    // Coupon related
    expCouponCheckbox.addEventListener('change', saveToLocalStorage);
    document.querySelectorAll('input[name="couponType"]').forEach(radio => {
        radio.addEventListener('change', saveToLocalStorage);
    });
    document.getElementById('couponCount').addEventListener('input', saveToLocalStorage);

    // Custom event related
    customEventCheckbox.addEventListener('change', saveToLocalStorage);
    document.getElementById('customBonus').addEventListener('input', saveToLocalStorage);
    document.getElementById('customDuration').addEventListener('input', saveToLocalStorage);

    // Schedule enable checkbox
    enableScheduleCheckbox.addEventListener('change', () => {
        toggleScheduleEnabled();
        saveToLocalStorage();
    });

    // Grinding schedule related
    document.querySelectorAll('input[name="scheduleMode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            toggleScheduleMode();
            saveToLocalStorage();
        });
    });
    document.getElementById('dailyHours').addEventListener('input', () => {
        clampDailyTimeInputs();
        updateScheduleWarning();
        updateAuraWarning();
        saveToLocalStorage();
    });
    document.getElementById('dailyMinutes').addEventListener('input', () => {
        clampDailyTimeInputs();
        updateScheduleWarning();
        updateAuraWarning();
        saveToLocalStorage();
    });
    document.getElementById('targetDays').addEventListener('input', () => {
        updateScheduleWarning();
        saveToLocalStorage();
    });

    // Daily aura related
    dailyAuraCheckbox.addEventListener('change', () => {
        toggleEventOptions(dailyAuraCheckbox, auraOptions);
        updateAuraWarning();
        saveToLocalStorage();
    });
    document.querySelectorAll('input[name="auraType"]').forEach(radio => {
        radio.addEventListener('change', saveToLocalStorage);
    });
    document.getElementById('auraDays').addEventListener('input', saveToLocalStorage);

    // Save to localStorage when basic inputs change
    currentLevelInput.addEventListener('input', saveToLocalStorage);
    currentExpInput.addEventListener('input', saveToLocalStorage);
    targetLevelInput.addEventListener('input', saveToLocalStorage);
    expEfficiencyInput.addEventListener('input', saveToLocalStorage);

    // History feature event listeners
    document.getElementById('recordBtn').addEventListener('click', recordLevelExp);
    document.getElementById('historyToggle').addEventListener('click', toggleHistoryPanel);
    document.getElementById('closeHistory').addEventListener('click', closeHistoryPanel);
    document.getElementById('manageHistory').addEventListener('click', showManageModal);
    document.getElementById('exportHistory').addEventListener('click', exportHistory);
    document.getElementById('importHistory').addEventListener('click', showImportModal);

    // Import modal event listeners
    document.getElementById('closeImportModal').addEventListener('click', hideImportModal);
    document.getElementById('cancelImport').addEventListener('click', hideImportModal);
    document.getElementById('confirmImport').addEventListener('click', confirmImport);

    // Manage modal event listeners
    document.getElementById('closeManageModal').addEventListener('click', hideManageModal);
    document.getElementById('clearAllHistory').addEventListener('click', clearAllHistory);
    document.getElementById('manageSortOrder').addEventListener('change', renderManageRecordList);

    // Chart options
    document.getElementById('showExpGain').addEventListener('change', () => {
        localStorage.setItem('artaleShowExpGain', document.getElementById('showExpGain').checked);
        renderHistoryChart();
    });

    // Close modals on background click
    document.getElementById('importModal').addEventListener('click', (e) => {
        if (e.target.id === 'importModal') {
            hideImportModal();
        }
    });
    document.getElementById('manageModal').addEventListener('click', (e) => {
        if (e.target.id === 'manageModal') {
            hideManageModal();
        }
    });
}

// Initialize DOM elements
function initDOMElements() {
    // Basic form elements
    form = document.getElementById('calcForm');
    currentLevelInput = document.getElementById('currentLevel');
    currentExpInput = document.getElementById('currentExp');
    targetLevelInput = document.getElementById('targetLevel');
    expEfficiencyInput = document.getElementById('expEfficiency');
    resultsDiv = document.getElementById('results');
    startLevelSpan = document.getElementById('startLevel');
    endLevelSpan = document.getElementById('endLevel');
    totalExpSpan = document.getElementById('totalExp');
    regularBonusSpan = document.getElementById('regularBonus');
    timeNeededSpan = document.getElementById('timeNeeded');
    unitManBtn = document.getElementById('unitMan');
    unitRegularBtn = document.getElementById('unitRegular');

    // Advanced options elements
    advancedOptions = document.getElementById('advancedOptions');
    advancedContent = document.getElementById('advancedContent');
    expCouponCheckbox = document.getElementById('expCoupon');
    couponOptions = document.getElementById('couponOptions');
    customEventCheckbox = document.getElementById('customEvent');
    customOptions = document.getElementById('customOptions');
    enableScheduleCheckbox = document.getElementById('enableSchedule');
    scheduleContent = document.getElementById('scheduleContent');
    dailyAuraCheckbox = document.getElementById('dailyAura');
    auraOptions = document.getElementById('auraOptions');
    dailyGrindingInput = document.getElementById('dailyGrindingInput');
    targetDaysInput = document.getElementById('targetDaysInput');
}

// Initialize
function init() {
    // Initialize DOM elements first
    initDOMElements();

    // Initialize event listeners
    initEventListeners();

    // Load saved data
    loadFromLocalStorage();

    // Load history
    loadHistory();
    updateRecordCount();

    // Restore advanced options collapsed state (default: open)
    if (localStorage.getItem('artaleAdvancedCollapsed') === 'true') {
        document.getElementById('advancedOptionsToggle').classList.add('collapsed');
        advancedContent.classList.add('hidden');
    }

    // Restore breakdown mode preference
    const savedBreakdownMode = localStorage.getItem('artaleBreakdownMode');
    if (savedBreakdownMode === 'daily') currentBreakdownMode = 'daily';

    // Restore chart UI state
    const showExpGain = localStorage.getItem('artaleShowExpGain') === 'true';
    document.getElementById('showExpGain').checked = showExpGain;

    if (localStorage.getItem('artaleHistoryOpen') === 'true') {
        document.getElementById('historyPanel').classList.remove('hidden');
        renderHistoryChart();
    }

    // Set default placeholder based on current unit
    if (currentUnit === 'man') {
        expEfficiencyInput.placeholder = '輸入每10分鐘獲得的經驗值 (萬)';
    }

    // Enable auto-save after a short delay to ensure everything is loaded
    setTimeout(() => {
        isInitializing = false;
    }, 100);
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ====================
// Level History Tracking
// ====================

let levelHistory = [];
let historyChart = null;

// Load history from localStorage
function loadHistory() {
    const savedHistory = localStorage.getItem('artaleExpHistory');
    if (savedHistory) {
        try {
            levelHistory = JSON.parse(savedHistory);
        } catch (error) {
            console.error('Error loading history:', error);
            levelHistory = [];
        }
    }
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('artaleExpHistory', JSON.stringify(levelHistory));
}

// Calculate total EXP from level and current exp
function calculateTotalExp(level, currentExp) {
    // Use pre-calculated accumulated exp data for O(1) lookup
    return accumulatedExpData[level - 1] + currentExp;
}

// Record current level and exp
function recordLevelExp() {
    const currentLevel = parseInt(currentLevelInput.value);
    const currentExp = parseInt(currentExpInput.value);

    // Validate inputs
    if (!currentLevel || !currentExp || currentLevel < 1 || currentLevel > 200 || currentExp < 0) {
        alert('請先輸入有效的等級和經驗值');
        return;
    }

    // Validate current exp is less than exp needed to level up
    if (currentLevel < 200) {
        const expNeededForNextLevel = expData[currentLevel].exp;
        if (currentExp >= expNeededForNextLevel) {
            alert(`現在EXP必須小於 ${formatNumber(expNeededForNextLevel)} (等級 ${currentLevel + 1} 所需經驗值)`);
            return;
        }
    }

    const timestamp = Date.now();
    const totalExp = calculateTotalExp(currentLevel, currentExp);

    levelHistory.push({
        timestamp: timestamp,
        level: currentLevel,
        exp: currentExp,
        totalExp: totalExp
    });

    saveHistory();

    // Show confirmation
    const now = new Date(timestamp);
    const timeStr = now.toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    alert(`已記錄!\n時間: ${timeStr}\n等級: ${currentLevel}\nEXP: ${formatNumber(currentExp)}`);

    // Update record count
    updateRecordCount();

    // Refresh chart if history panel is open
    const historyPanel = document.getElementById('historyPanel');
    if (historyPanel && !historyPanel.classList.contains('hidden')) {
        renderHistoryChart();
    }
}

// Update record count display
function updateRecordCount() {
    const recordCount = document.getElementById('recordCount');
    if (recordCount) {
        const totalRecords = levelHistory.length;

        // Check aggregation status to show appropriate note
        let shouldShowLimitNote = false;
        let noteText = '';

        if (totalRecords > 0) {
            const sortedHistory = [...levelHistory].sort((a, b) => a.timestamp - b.timestamp);

            // Count distinct days with records
            const daysWithRecords = new Set();
            sortedHistory.forEach(record => {
                const date = new Date(record.timestamp);
                const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                daysWithRecords.add(dayKey);
            });

            // Calculate day span
            const firstDate = new Date(sortedHistory[0].timestamp);
            const lastDate = new Date(sortedHistory[sortedHistory.length - 1].timestamp);
            const daySpan = Math.floor((lastDate - firstDate) / (24 * 60 * 60 * 1000));

            const shouldAggregate = daySpan >= 5 && daysWithRecords.size >= 5;

            if (shouldAggregate && daysWithRecords.size > 10) {
                // In aggregated mode and showing limited days
                shouldShowLimitNote = true;
                noteText = '(僅顯示最後10天)';
            } else if (!shouldAggregate && totalRecords > 10) {
                // Not aggregating and showing limited records
                shouldShowLimitNote = true;
                noteText = '(僅顯示最後10筆)';
            }
        }

        if (shouldShowLimitNote) {
            recordCount.textContent = `${totalRecords} 筆資料 ${noteText}`;
        } else {
            recordCount.textContent = `${totalRecords} 筆資料`;
        }
    }
}

// Toggle history panel
function toggleHistoryPanel() {
    const historyPanel = document.getElementById('historyPanel');
    const isHidden = historyPanel.classList.contains('hidden');

    if (isHidden) {
        historyPanel.classList.remove('hidden');
        localStorage.setItem('artaleHistoryOpen', 'true');
        renderHistoryChart();
    } else {
        historyPanel.classList.add('hidden');
        localStorage.setItem('artaleHistoryOpen', 'false');
    }
}

// Close history panel
function closeHistoryPanel() {
    const historyPanel = document.getElementById('historyPanel');
    historyPanel.classList.add('hidden');
    localStorage.setItem('artaleHistoryOpen', 'false');
}

// Show manage records modal
function showManageModal() {
    document.getElementById('manageModal').classList.remove('hidden');
    renderManageRecordList();
}

// Hide manage records modal
function hideManageModal() {
    document.getElementById('manageModal').classList.add('hidden');
}

// Render the record list in the manage modal
function renderManageRecordList() {
    const listContainer = document.getElementById('manageRecordList');
    const sortOrder = document.getElementById('manageSortOrder').value;

    if (levelHistory.length === 0) {
        listContainer.innerHTML = '<div class="manage-empty">目前沒有任何紀錄</div>';
        return;
    }

    // Create sorted copy with original indices
    const sortedRecords = levelHistory.map((record, index) => ({ ...record, originalIndex: index }));
    sortedRecords.sort((a, b) => sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

    listContainer.innerHTML = sortedRecords.map(record => {
        const date = new Date(record.timestamp);
        const timeStr = date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        return `<div class="manage-record-item" data-index="${record.originalIndex}">
            <div class="manage-record-info">
                <span class="manage-record-time">${timeStr}</span>
                <div class="manage-record-fields">
                    <label class="manage-field">Lv. <input type="number" class="manage-input manage-input-level" value="${record.level}" readonly></label>
                    <label class="manage-field">EXP <input type="number" class="manage-input manage-input-exp" value="${record.exp}" readonly></label>
                </div>
            </div>
            <div class="manage-record-actions">
                <button class="btn-edit-record" onclick="toggleEditRecord(this, ${record.originalIndex})" aria-label="編輯此紀錄">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-delete-record" onclick="deleteSingleRecord(${record.originalIndex})" aria-label="刪除此紀錄">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>`;
    }).join('');
}

// Toggle edit mode for a record row
function toggleEditRecord(btn, index) {
    const row = btn.closest('.manage-record-item');
    const levelInput = row.querySelector('.manage-input-level');
    const expInput = row.querySelector('.manage-input-exp');
    const isEditing = !levelInput.readOnly;

    if (isEditing) {
        // Confirm edit
        const newLevel = parseInt(levelInput.value);
        const newExp = parseInt(expInput.value);

        if (!newLevel || newLevel < 1 || newLevel > 200 || isNaN(newExp) || newExp < 0) {
            alert('請輸入有效的等級 (1-200) 和經驗值');
            return;
        }

        if (newLevel < 200) {
            const expNeeded = expData[newLevel].exp;
            if (newExp >= expNeeded) {
                alert(`現在EXP必須小於 ${formatNumber(expNeeded)} (等級 ${newLevel + 1} 所需經驗值)`);
                return;
            }
        }

        levelHistory[index].level = newLevel;
        levelHistory[index].exp = newExp;
        levelHistory[index].totalExp = calculateTotalExp(newLevel, newExp);
        saveHistory();
        updateRecordCount();

        // Refresh chart if history panel is open
        const historyPanel = document.getElementById('historyPanel');
        if (historyPanel && !historyPanel.classList.contains('hidden')) {
            renderHistoryChart();
        }

        // Switch back to readonly
        levelInput.readOnly = true;
        expInput.readOnly = true;
        levelInput.classList.remove('editing');
        expInput.classList.remove('editing');
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>`;
    } else {
        // Enter edit mode
        levelInput.readOnly = false;
        expInput.readOnly = false;
        levelInput.classList.add('editing');
        expInput.classList.add('editing');
        levelInput.focus();
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>`;
    }
}

// Delete a single record by its original index
function deleteSingleRecord(index) {
    if (!confirm('確定要刪除此紀錄嗎？')) {
        return;
    }

    levelHistory.splice(index, 1);
    saveHistory();
    updateRecordCount();
    renderManageRecordList();

    // Refresh chart if history panel is open
    const historyPanel = document.getElementById('historyPanel');
    if (historyPanel && !historyPanel.classList.contains('hidden')) {
        renderHistoryChart();
    }
}

// Clear all history with confirmation
function clearAllHistory() {
    if (levelHistory.length === 0) {
        alert('目前沒有記錄可以清除');
        return;
    }

    const confirmation = prompt('此操作將清除所有記錄！\n請輸入 "delete" 以確認刪除：');

    if (confirmation === 'delete') {
        levelHistory = [];
        saveHistory();
        updateRecordCount();
        renderManageRecordList();

        // Refresh chart if history panel is open
        const historyPanel = document.getElementById('historyPanel');
        if (historyPanel && !historyPanel.classList.contains('hidden')) {
            renderHistoryChart();
        }
        alert('所有記錄已清除！');
    } else if (confirmation !== null) {
        alert('輸入不正確，取消刪除');
    }
}

// Export history as JSON file
function exportHistory() {
    if (levelHistory.length === 0) {
        alert('目前沒有記錄可以匯出');
        return;
    }

    // Create JSON string
    const jsonString = JSON.stringify(levelHistory, null, 2);

    // Create blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Generate filename with current date
    const date = new Date();
    const filename = `artale-exp-records-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.txt`;

    link.href = url;
    link.download = filename;
    link.click();

    // Clean up
    URL.revokeObjectURL(url);
}

// Show import modal
function showImportModal() {
    const modal = document.getElementById('importModal');
    const textarea = document.getElementById('importTextArea');
    const errorDiv = document.getElementById('importError');

    // Clear previous input and errors
    textarea.value = '';
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';

    // Show modal
    modal.classList.remove('hidden');
}

// Hide import modal
function hideImportModal() {
    const modal = document.getElementById('importModal');
    modal.classList.add('hidden');
}

// Validate and import history
function confirmImport() {
    const textarea = document.getElementById('importTextArea');
    const errorDiv = document.getElementById('importError');
    const jsonString = textarea.value.trim();

    // Clear previous errors
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';

    // Validate input
    if (!jsonString) {
        errorDiv.textContent = '請貼上 JSON 資料';
        errorDiv.classList.remove('hidden');
        return;
    }

    try {
        // Parse JSON
        const importedData = JSON.parse(jsonString);

        // Validate data structure
        if (!Array.isArray(importedData)) {
            throw new Error('資料格式錯誤：必須是陣列');
        }

        if (importedData.length === 0) {
            throw new Error('資料為空：沒有記錄可以匯入');
        }

        // Validate each record
        for (let i = 0; i < importedData.length; i++) {
            const record = importedData[i];

            if (!record || typeof record !== 'object') {
                throw new Error(`記錄 ${i + 1} 格式錯誤：必須是物件`);
            }

            if (typeof record.timestamp !== 'number' || record.timestamp <= 0) {
                throw new Error(`記錄 ${i + 1} 的 timestamp 無效`);
            }

            if (typeof record.level !== 'number' || record.level < 1 || record.level > 200) {
                throw new Error(`記錄 ${i + 1} 的 level 無效 (必須在 1-200 之間)`);
            }

            if (typeof record.exp !== 'number' || record.exp < 0) {
                throw new Error(`記錄 ${i + 1} 的 exp 無效`);
            }

            if (typeof record.totalExp !== 'number' || record.totalExp < 0) {
                throw new Error(`記錄 ${i + 1} 的 totalExp 無效`);
            }
        }

        // Ask for confirmation if there are existing records
        if (levelHistory.length > 0) {
            const confirmReplace = confirm(
                `目前已有 ${levelHistory.length} 筆記錄。\n` +
                `匯入 ${importedData.length} 筆新記錄後，將會合併所有記錄。\n\n` +
                `是否繼續？`
            );

            if (!confirmReplace) {
                return;
            }
        }

        // Merge imported data with existing data (avoid duplicates by timestamp)
        const mergedData = [...levelHistory];
        const existingTimestamps = new Set(levelHistory.map(r => r.timestamp));

        importedData.forEach(record => {
            if (!existingTimestamps.has(record.timestamp)) {
                mergedData.push(record);
            }
        });

        // Update history
        levelHistory = mergedData;
        saveHistory();
        updateRecordCount();
        renderHistoryChart();

        // Show success message
        alert(`成功匯入 ${importedData.length} 筆記錄！`);

        // Close modal
        hideImportModal();
    } catch (error) {
        // Show error message
        errorDiv.textContent = `匯入失敗：${error.message}`;
        errorDiv.classList.remove('hidden');
    }
}

// Helper function to get total EXP at a specific level
function getTotalExpAtLevel(level) {
    // Use pre-calculated accumulated exp data for O(1) lookup
    return accumulatedExpData[level - 1] || 0;
}

// Helper function to convert total EXP to level + percentage
function totalExpToLevelPercent(totalExp) {
    // Binary search to find the level (O(log n) instead of O(n))
    let left = 0;
    let right = accumulatedExpData.length - 1;
    let level = 1;

    // Find the highest level where accumulated exp <= totalExp
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (accumulatedExpData[mid] <= totalExp) {
            level = mid + 1;
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    // Calculate remaining exp in current level
    const expAtLevelStart = accumulatedExpData[level - 1];
    const remainingExp = totalExp - expAtLevelStart;

    // Calculate percentage
    const expForCurrentLevel = expData[level] ? expData[level].exp : 1;
    const percentage = (remainingExp / expForCurrentLevel) * 100;

    return { level, percentage };
}

// Render history chart
function renderHistoryChart() {
    const canvas = document.getElementById('historyChart');
    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (historyChart) {
        historyChart.destroy();
    }

    // If no data, show message
    if (levelHistory.length === 0) {
        // Get container dimensions
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Set canvas size to match container
        canvas.width = containerWidth;
        canvas.height = containerHeight;

        // Clear canvas and show message
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px "Microsoft JhengHei", Arial, sans-serif';
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('尚無記錄資料', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Sort by timestamp
    const sortedHistory = [...levelHistory].sort((a, b) => a.timestamp - b.timestamp);

    // Check if we should aggregate by day
    let displayHistory;
    let previousRecord = null;
    let shouldAggregate = false;
    let dateFormat = { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };

    if (sortedHistory.length > 0) {
        // Calculate day span and number of distinct days
        const firstDate = new Date(sortedHistory[0].timestamp);
        const lastDate = new Date(sortedHistory[sortedHistory.length - 1].timestamp);
        const daySpan = Math.floor((lastDate - firstDate) / (24 * 60 * 60 * 1000));

        // Count distinct days with records
        const daysWithRecords = new Set();
        sortedHistory.forEach(record => {
            const date = new Date(record.timestamp);
            const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            daysWithRecords.add(dayKey);
        });

        // Aggregate if span >= 5 days AND has records in >= 5 distinct days
        shouldAggregate = daySpan >= 5 && daysWithRecords.size >= 5;

        if (shouldAggregate) {
            // Group by day and keep only the last record of each day
            const dailyRecords = new Map();
            sortedHistory.forEach(record => {
                const date = new Date(record.timestamp);
                const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                // Always keep the latest record for each day (overwrite previous)
                dailyRecords.set(dayKey, record);
            });

            // Convert map to array and sort by timestamp
            let allDailyRecords = Array.from(dailyRecords.values()).sort((a, b) => a.timestamp - b.timestamp);

            // Keep the record before the displayed slice for EXP gain calculation
            if (allDailyRecords.length > 10) {
                previousRecord = allDailyRecords[allDailyRecords.length - 11];
            } else if (allDailyRecords.length > 0) {
                // All days shown - use the first raw record of the first day as baseline
                // so the first bar shows EXP gained within that day
                const firstDay = allDailyRecords[0];
                const firstDayDate = new Date(firstDay.timestamp);
                const firstDayKey = `${firstDayDate.getFullYear()}-${firstDayDate.getMonth()}-${firstDayDate.getDate()}`;
                const firstRawRecord = sortedHistory.find(r => {
                    const d = new Date(r.timestamp);
                    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === firstDayKey;
                });
                if (firstRawRecord && firstRawRecord.timestamp < firstDay.timestamp) {
                    previousRecord = firstRawRecord;
                }
            }

            // Show only last 10 days
            displayHistory = allDailyRecords.slice(-10);

            // Use date-only format for x-axis
            dateFormat = { year: 'numeric', month: '2-digit', day: '2-digit' };
        } else {
            // Keep the record before the displayed slice for EXP gain calculation
            if (sortedHistory.length > 10) {
                previousRecord = sortedHistory[sortedHistory.length - 11];
            }

            // Show latest 10 records with time
            displayHistory = sortedHistory.slice(-10);
        }
    } else {
        displayHistory = sortedHistory;
    }

    // If only 1 record, duplicate it with a slight time offset to show a flat line
    if (displayHistory.length === 1) {
        const singleRecord = displayHistory[0];
        // Create a synthetic earlier point (1 hour before) with the same exp
        const syntheticRecord = {
            timestamp: singleRecord.timestamp - (60 * 60 * 1000), // 1 hour earlier
            level: singleRecord.level,
            exp: singleRecord.exp,
            totalExp: singleRecord.totalExp
        };
        displayHistory = [syntheticRecord, singleRecord];
    }

    // Build x-axis labels
    const labels = displayHistory.map((record, i) => {
        const date = new Date(record.timestamp);
        if (shouldAggregate) {
            // Aggregated mode: show DD, with month prefix on first item and month boundaries
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();

            if (i === 0) {
                // First item: show YYYY-MM on second line
                return [dd, `${yyyy}-${mm}`];
            }

            // Check if this is a new month compared to the previous item
            const prevDate = new Date(displayHistory[i - 1].timestamp);
            if (date.getMonth() !== prevDate.getMonth() || date.getFullYear() !== prevDate.getFullYear()) {
                return [dd, mm];
            }

            return dd;
        } else {
            // Non-aggregated: show MM/DD HH:mm
            return date.toLocaleDateString('zh-TW', dateFormat);
        }
    });
    const data = displayHistory.map(record => record.totalExp);

    // Calculate EXP gain per entry
    const showExpGain = document.getElementById('showExpGain').checked;
    const expGainData = displayHistory.map((record, i) => {
        if (i === 0) {
            return previousRecord ? record.totalExp - previousRecord.totalExp : 0;
        }
        return record.totalExp - displayHistory[i - 1].totalExp;
    });

    // Calculate and display average daily EXP
    const avgExpEl = document.getElementById('avgDailyExp');
    if (displayHistory.length >= 2) {
        const firstRecord = previousRecord || displayHistory[0];
        const lastRecord = displayHistory[displayHistory.length - 1];
        const totalGain = lastRecord.totalExp - firstRecord.totalExp;
        const daySpanMs = lastRecord.timestamp - firstRecord.timestamp;
        const dayCount = daySpanMs / (24 * 60 * 60 * 1000);
        if (dayCount >= 1) {
            const avgDaily = Math.round(totalGain / dayCount);
            avgExpEl.textContent = `平均每日獲得EXP: ${formatNumber(avgDaily)}`;
        } else {
            avgExpEl.textContent = '';
        }
    } else {
        avgExpEl.textContent = '';
    }

    // Find min and max levels from displayed history
    const minLevel = Math.min(...displayHistory.map(r => r.level));
    const currentLevel = parseInt(currentLevelInput.value) || displayHistory[displayHistory.length - 1].level;
    const maxLevel = currentLevel + 1;

    // Calculate min and max total EXP for Y-axis
    const minTotalExp = getTotalExpAtLevel(minLevel);
    const maxTotalExp = getTotalExpAtLevel(maxLevel);

    // Generate Y-axis ticks
    const levelRange = maxLevel - minLevel;
    const yAxisTicks = [];

    // Determine percentage markers based on level range
    let percentageMarkers;
    if (levelRange <= 4) {
        percentageMarkers = [0, 50]; // Show 50% markers for small ranges (3-4 levels)
    } else {
        percentageMarkers = [0]; // Show only level boundaries for large ranges (5+ levels)
    }

    // Generate ticks for each level and percentage
    for (let level = minLevel; level <= maxLevel; level++) {
        const levelTotalExp = getTotalExpAtLevel(level);

        percentageMarkers.forEach(pct => {
            if (level === maxLevel && pct > 0) return; // Don't show percentages for max level

            const expForThisLevel = expData[level] ? expData[level].exp : 0;
            const tickValue = levelTotalExp + (expForThisLevel * pct / 100);

            yAxisTicks.push({
                value: tickValue,
                level: level,
                percentage: pct
            });
        });
    }

    // Get theme colors
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    const buttonColor = getComputedStyle(document.documentElement).getPropertyValue('--button-bg').trim();
    const inputBorder = getComputedStyle(document.documentElement).getPropertyValue('--input-border').trim();
    const warningColor = '#f59e0b';

    // X-axis configuration with uniform spacing
    const xAxisConfig = {
        ticks: {
            color: textColor,
            font: {
                family: "'Microsoft JhengHei', Arial, sans-serif",
                size: 10
            },
            maxRotation: shouldAggregate ? 0 : 45,
            minRotation: shouldAggregate ? 0 : 45,
            autoSkip: false
        },
        grid: {
            color: inputBorder
        }
    };

    // Build datasets
    const datasets = [{
        label: '等級進度',
        data: data,
        borderColor: buttonColor,
        backgroundColor: buttonColor + '33',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y'
    }];

    if (showExpGain) {
        datasets.push({
            label: '獲得EXP',
            data: expGainData,
            type: 'bar',
            backgroundColor: warningColor + '66',
            borderColor: warningColor,
            borderWidth: 1,
            yAxisID: 'yGain',
            order: 1
        });
        // Move line chart to front
        datasets[0].order = 0;
    }

    // Build scales
    const scales = {
        x: xAxisConfig,
        y: {
            position: 'left',
            min: minTotalExp,
            max: maxTotalExp,
            ticks: {
                color: textColor,
                font: {
                    family: "'Microsoft JhengHei', Arial, sans-serif",
                    size: 10
                },
                callback: function (value) {
                    const tick = yAxisTicks.find(t => Math.abs(t.value - value) < 1);
                    if (tick) {
                        if (tick.percentage === 0) {
                            return `Lv.${tick.level}`;
                        } else {
                            return `${tick.percentage}%`;
                        }
                    }
                    return '';
                },
                stepSize: undefined,
                autoSkip: false,
                includeBounds: true
            },
            afterBuildTicks: function (axis) {
                axis.ticks = yAxisTicks.map(tick => ({
                    value: tick.value,
                    label: tick.percentage === 0 ? `Lv.${tick.level}` : `${tick.percentage}%`
                }));
            },
            grid: {
                color: function (context) {
                    const tick = yAxisTicks.find(t => Math.abs(t.value - context.tick.value) < 1);
                    if (tick && tick.percentage === 0) {
                        return textColor + '40';
                    }
                    return inputBorder;
                },
                lineWidth: function (context) {
                    const tick = yAxisTicks.find(t => Math.abs(t.value - context.tick.value) < 1);
                    if (tick && tick.percentage === 0) {
                        return 2;
                    }
                    return 1;
                }
            }
        }
    };

    if (showExpGain) {
        const maxGain = Math.max(...expGainData);
        scales.yGain = {
            position: 'right',
            min: 0,
            max: maxGain * 1.2 || 1,
            ticks: {
                color: warningColor,
                font: {
                    family: "'Microsoft JhengHei', Arial, sans-serif",
                    size: 10
                },
                callback: function (value) {
                    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                    return value;
                }
            },
            grid: {
                drawOnChartArea: false
            }
        };
    }

    // Create chart
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: {
                            family: "'Microsoft JhengHei', Arial, sans-serif",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            if (context.dataset.yAxisID === 'yGain') {
                                return `獲得EXP: ${formatNumber(context.raw)}`;
                            }
                            const record = displayHistory[context.dataIndex];
                            if (!record) return '';

                            const { percentage } = totalExpToLevelPercent(record.totalExp);
                            return [
                                `等級: ${record.level} (${percentage.toFixed(1)}%)`,
                                `當前EXP: ${formatNumber(record.exp)}`,
                                `總EXP: ${formatNumber(record.totalExp)}`
                            ];
                        }
                    }
                }
            },
            scales: scales
        }
    });
}

