const STORAGE_KEY = 'spw-budget-state:v1';
const MAX_TIER_COST = 18000;
const TIERS = [
    {
        id: 'scope',
        cost: 250,
        color: 'var(--op-object-color, #c48a28)',
        message: 'A scope card is now within reach.',
    },
    {
        id: 'creator',
        cost: 600,
        color: 'var(--op-topic-color, #2f8f6b)',
        message: 'Creator work is now within reach.',
    },
    {
        id: 'systems',
        cost: 5000,
        color: 'var(--op-frame-color, #1a9999)',
        message: 'A systems sprint is now within reach.',
    },
    {
        id: 'advisory',
        cost: 18000,
        color: 'var(--op-probe-color, #6b4bb6)',
        message: 'Architecture and advisory are now within reach.',
    },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('budget-app-root');
    if (!appRoot) return;

    const descInput = document.getElementById('budget-desc');
    const amountInput = document.getElementById('budget-amount');
    const btnIncome = document.getElementById('btn-add-income');
    const btnExpense = document.getElementById('btn-add-expense');
    const btnReset = document.getElementById('btn-reset-budget');
    const entriesList = document.getElementById('budget-entries');
    const totalDisplay = document.getElementById('net-total-display');
    const progressBar = document.getElementById('tier-progress-bar');
    const messageEl = document.getElementById('tier-message');
    const tierCards = Array.from(document.querySelectorAll('.budget-tier-card'));

    let entries = [];

    // Budgeting macros via query string — higher-order dimension & resource modeling support.
    // Examples:
    //   ?macro=weird-illustrator
    //   ?dimensions=attention+creative-capital+illustrator-weird&seedAmount=850
    //   ?dims=attention, prompt-tokens-1200
    // Parsed once on load. If no local ledger state, seeds a starter entry or prefills inputs.
    // Fully optional, progressive, shareable (powerusers construct complex models in URLs).
    // Follows site conventions (URLSearchParams + replace(/^\?/, '')).
    function applyBudgetingMacros() {
        try {
            const params = new URLSearchParams(String(window.location.search || '').replace(/^\?/, ''));
            const rawMacro = params.get('macro') || params.get('m') || '';
            const rawDims = params.get('dimensions') || params.get('dims') || params.get('d') || '';
            const seedAmount = parseFloat(params.get('amount') || params.get('seedAmount') || params.get('a') || '');

            let dimensions = [];
            if (rawMacro) {
                // Named macro → treat the macro name as a primary dimension (can be extended later with a registry)
                dimensions.push(rawMacro);
            }
            if (rawDims) {
                const extra = rawDims.split(/\s*[+,]\s*/).map(d => d.trim()).filter(Boolean);
                dimensions = [...dimensions, ...extra];
            }
            dimensions = [...new Set(dimensions)]; // dedupe

            if (dimensions.length === 0) return null;

            // If we have a seed amount and the form inputs exist, prefill for easy "apply macro" flow
            if (Number.isFinite(seedAmount) && seedAmount > 0 && amountInput) {
                amountInput.value = seedAmount;
            }
            if (dimensions.length && document.getElementById('budget-motive')) {
                // Prefill the higher-order dimension field so the visitor sees the model immediately
                document.getElementById('budget-motive').value = dimensions.join(' + ');
            }

            // Emit for deeper wiring / instrumentation (higher-order macro loaded as a distinct phase)
            const bus = window.__SPW_SITE__?.bus || window.bus;
            if (bus && typeof bus.emit === 'function') {
                bus.emit('spw:value-updated', {
                    surface: 'tools-budgeting',
                    kind: 'higher-order-macro',
                    macro: rawMacro || null,
                    dimensions,
                    seedAmount: Number.isFinite(seedAmount) ? seedAmount : null,
                    timestamp: Date.now(),
                });
            }

            return { dimensions, seedAmount: Number.isFinite(seedAmount) ? seedAmount : null, rawMacro };
        } catch (_) {
            return null;
        }
    }

    // Run macros early (before loadState) so query can seed the UI / starter state
    const appliedMacro = applyBudgetingMacros();

    function makeId() {
        if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function formatCurrency(value) {
        return currencyFormatter.format(value);
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                entries = [];
                render();
                return;
            }

            const parsed = JSON.parse(raw);
            entries = Array.isArray(parsed) ? parsed : [];
        } catch {
            entries = [];
        }

        render();
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch {
            // Ignore storage failures and continue rendering the in-memory state.
        }

        render();
    }

    function addEntry(type) {
        const desc = descInput.value.trim() || 'Ledger entry';
        const amount = Number.parseFloat(amountInput.value);
        const rawMotive = (document.getElementById('budget-motive')?.value || '').trim();

        // Higher-order dimension scalability: parse simple "dim1 + dim2 + dim3" or comma syntax into array.
        // This turns the single optional field into a lightweight, extensible resource-dimension model.
        // Powerusers can express arbitrarily many named dimensions; the system treats them as first-class primable resources.
        // No new UI, no schema, no rules — pure optional textual composition that becomes structured data + Spw expressions.
        const dimensions = rawMotive
            ? rawMotive.split(/\s*[+,]\s*/).map(d => d.trim()).filter(Boolean)
            : [];

        if (!Number.isFinite(amount) || amount <= 0) {
            amountInput.focus();
            return;
        }

        entries.push({
            id: makeId(),
            type,
            desc,
            amount,
            motive: rawMotive || undefined,
            dimensions: dimensions.length ? dimensions : undefined, // higher-order named resource dimensions (scalable, composable)
        });

        descInput.value = '';
        amountInput.value = '';
        // Do not clear the dimension field — supports iterative higher-order modeling (add one dimension, save, add another).
        descInput.focus();
        saveState();
    }

    function removeEntry(id) {
        entries = entries.filter((entry) => entry.id !== id);
        saveState();
    }

    function resetLedger() {
        if (!window.confirm('This will wipe your local ledger. Are you sure?')) return;
        entries = [];
        saveState();
    }

    function buildAmountNode(entry) {
        const amount = document.createElement('span');
        const sign = entry.type === 'income' ? '+' : '-';

        amount.className = 'budget-item__amount';
        amount.textContent = `${sign}${formatCurrency(entry.amount)}`;

        return amount;
    }

    function buildEntryNode(entry) {
        const item = document.createElement('li');
        const content = document.createElement('div');
        const title = document.createElement('strong');
        const amount = buildAmountNode(entry);
        const removeButton = document.createElement('button');

        item.className = 'budget-item';
        item.dataset.type = entry.type;
        if (entry.dimensions && entry.dimensions.length > 1) {
            item.dataset.higherOrder = 'true';
            item.dataset.dimensionCount = String(entry.dimensions.length);
        } else if (entry.motive) {
            item.dataset.hasMotive = 'true';
        }

        content.className = 'budget-item__content';
        title.textContent = entry.desc;

        // Higher-order dimensions (or fallback single motive) as clean, inspectable micro-labels.
        // Cleanup: single container, explicit dataset for CSS/JS targeting, consistent with vocabulary + operator grammar.
        const dimsToShow = (entry.dimensions && entry.dimensions.length) ? entry.dimensions
            : (entry.motive ? [entry.motive] : []);

        if (dimsToShow.length) {
            const dimContainer = document.createElement('span');
            dimContainer.className = 'budget-item__dimensions';
            dimsToShow.forEach((dim, idx) => {
                const dimEl = document.createElement('span');
                dimEl.className = 'budget-item__motive budget-item__dimension';
                dimEl.setAttribute('data-spw-vocabulary-term', '');
                dimEl.setAttribute('data-spw-operator', idx === 0 ? 'object' : 'topic');
                dimEl.textContent = dim;
                dimEl.title = 'Higher-order resource dimension — primes as part of the composed model';
                dimContainer.append(dimEl);
            });
            content.append(title, amount, dimContainer);
        } else {
            content.append(title, amount);
        }

        removeButton.className = 'budget-item__remove';
        removeButton.type = 'button';
        removeButton.textContent = '×';
        removeButton.setAttribute('aria-label', `Remove ${entry.desc}`);
        removeButton.addEventListener('click', () => removeEntry(entry.id));

        // Prime affordance for money entries — now emits higher-order dimension structure.
        // When multiple dimensions are present, the payload carries a dimensions array + a composed Spw-style expression.
        // This is the concrete scalability improvement: the same optional field now models (and primes) higher-order,
        // multi-dimensional resources without any new chrome or rules. Cauldron receives first-class compositional material.
        const primeBtn = document.createElement('button');
        primeBtn.className = 'budget-item__prime operator-chip';
        primeBtn.type = 'button';
        primeBtn.textContent = 'prime to cauldron';
        primeBtn.addEventListener('click', () => {
            try {
                const bus = window.__SPW_SITE__?.bus || window.bus;
                if (bus && typeof bus.emit === 'function') {
                    const dims = entry.dimensions || (entry.motive ? [entry.motive] : []);
                    const dimSlug = dims.length ? '-dims-' + dims.map(d => d.slice(0, 16).replace(/\s+/g, '-')).join('+') : '';
                    const expr = `${entry.amount}-${entry.type}${dimSlug}`;
                    bus.emit('spell:capture', {
                        expression: expr,
                        label: `${entry.desc} (${entry.type} ${entry.amount}${dims.length ? ' — ' + dims.join(' + ') : ''})`,
                        type: 'numerical',
                        value: entry.amount,
                        unit: entry.type,
                        origin: 'budgeting-tool-money',
                        wonder: dims.length ? 'higher-order-capacity' : (entry.motive ? 'character-capacity' : 'capacity'),
                        primedBy: 'money-prime',
                        motive: entry.motive || undefined,
                        dimensions: dims.length ? dims : undefined, // explicit higher-order dimension array for scalable modeling
                        context: 'funding-self-imagination',
                        higherOrder: dims.length > 1,
                    });
                }
            } catch (_) {}
        });

        item.append(content, removeButton, primeBtn);

        return item;
    }

    function buildEmptyNode() {
        const empty = document.createElement('li');
        empty.className = 'budget-empty';
        empty.textContent = 'No entries yet. Add a saved dollar or an expense above.';
        return empty;
    }

    function render() {
        const items = entries.map(buildEntryNode);
        const total = entries.reduce((sum, entry) => {
            return sum + (entry.type === 'income' ? entry.amount : -entry.amount);
        }, 0);

        entriesList.replaceChildren(...(items.length ? items : [buildEmptyNode()]));
        updateDashboard(total);
    }

    function setTierMessage(text, state) {
        messageEl.textContent = text;
        messageEl.dataset.state = state;
    }

    function updateDashboard(netValue) {
        const clampedValue = Math.max(0, netValue);
        const percent = Math.min((clampedValue / MAX_TIER_COST) * 100, 100);
        const nextTier = TIERS.find((tier) => netValue < tier.cost) || null;

        progressBar.style.width = `${percent}%`;
        totalDisplay.textContent = formatCurrency(netValue);

        if (netValue < 0) {
            setTierMessage(`You are ${formatCurrency(Math.abs(netValue))} below zero. Restore baseline first, then map the next threshold.`, 'negative');
        } else if (!nextTier) {
            setTierMessage('Staff-level consulting is within reach. You can plan around architecture or diligence instead of only the minimum viable scope.', 'complete');
        } else if (nextTier.id === 'scope') {
            setTierMessage(`Need ${formatCurrency(nextTier.cost - netValue)} more to reach a scope card.`, 'neutral');
        } else {
            const unlockedTier = TIERS[TIERS.findIndex((tier) => tier.id === nextTier.id) - 1];
            const nextLabel = nextTier.id === 'creator'
                ? 'creator work'
                : nextTier.id === 'systems'
                    ? 'a systems sprint'
                    : 'architecture and advisory';
            setTierMessage(`${unlockedTier.message} ${formatCurrency(nextTier.cost - netValue)} more reaches ${nextLabel}.`, unlockedTier.id === 'scope' ? 'growth' : 'complete');
        }

        tierCards.forEach((card) => {
            const cost = Number.parseInt(card.dataset.cost || '0', 10);
            if (netValue >= cost) {
                card.dataset.state = 'unlocked';
            } else {
                delete card.dataset.state;
            }
        });

        // Grounding / trace channel for powerusers and future instrumentation:
        // Emit on dashboard updates so console, layout-shift-audit, spwCompose, and cauldron-adjacent listeners
        // can observe "funding narrative" phase changes (tier crossings, capacity shifts).
        // This is the inspectable "atmosphere to trace changes and wonder about variants" without new UI chrome.
        // When instrumentation registers 'funding-narrative' as a trope (or reuses value-updated), this payload
        // becomes a first-class expressive phase that can be marked, snapshot, and tuned.
        try {
            const bus = window.__SPW_SITE__?.bus || window.bus;
            if (bus && typeof bus.emit === 'function') {
                bus.emit('spw:value-updated', {
                    surface: 'tools-budgeting',
                    kind: 'funding-narrative',
                    netValue,
                    nextTier: nextTier ? nextTier.id : 'complete',
                    timestamp: Date.now(),
                });
            }

            // Deeper higher-order wiring: if any current entries have multiple dimensions, surface a distinct
            // 'higher-order-dimension' phase so markLayoutTrope / layout-shift-audit / spwCompose can observe it.
            const hasHigherOrder = entries.some(e => e.dimensions && e.dimensions.length > 1);
            if (hasHigherOrder && window.markLayoutTrope) {
                const dash = document.getElementById('budget-dashboard');
                if (dash) {
                    window.markLayoutTrope(dash, 'higher-order-dimension', {
                        scope: 'budgeting-resource-model',
                        tuning: { activeHigherOrderEntries: entries.filter(e => e.dimensions?.length > 1).length },
                    });
                }
            }
        } catch (_) {}
    }

    btnIncome.addEventListener('click', () => addEntry('income'));
    btnExpense.addEventListener('click', () => addEntry('expense'));
    btnReset.addEventListener('click', resetLedger);

    [descInput, amountInput].forEach((input) => {
        input.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            addEntry('income');
        });
    });

    // Time budgeting support: first-class time capacity alongside money.
    // Aligns with site rhythmic cycles and numericity mode.
    // Time entries are captured as numerical cauldron ingredients with quantifiers.
    // The baker's dozen (13-modulo) specifics are an easter egg — revealed through cauldron priming and the numericity emphasis mode rather than primary UI text.
    const timeDescInput = document.getElementById('time-desc');
    const timeAmountInput = document.getElementById('time-amount');
    const timeUnitSelect = document.getElementById('time-unit');
    const btnTimeSaved = document.getElementById('btn-add-time-saved');
    const btnTimeUsed = document.getElementById('btn-add-time-used');
    const timeEntriesList = document.getElementById('time-entries');
    const timeTotalDisplay = document.getElementById('time-total-display');
    const timeMessageEl = document.getElementById('time-tier-message');

    let timeEntries = [];

    function loadTimeState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY + ':time');
            timeEntries = raw ? JSON.parse(raw) : [];
        } catch { timeEntries = []; }
        renderTime();
    }

    function saveTimeState() {
        try {
            localStorage.setItem(STORAGE_KEY + ':time', JSON.stringify(timeEntries));
        } catch {}
        renderTime();
    }

    function addTimeEntry(type) {
        const desc = timeDescInput.value.trim() || 'Time entry';
        const amount = Number.parseFloat(timeAmountInput.value);
        const unit = timeUnitSelect.value;
        const rawMotive = (document.getElementById('budget-motive')?.value || '').trim();

        // Higher-order dimension support for time entries (parity with money path for scalable resource modeling)
        const dimensions = rawMotive
            ? rawMotive.split(/\s*[+,]\s*/).map(d => d.trim()).filter(Boolean)
            : [];

        if (!Number.isFinite(amount) || amount <= 0) {
            timeAmountInput.focus();
            return;
        }

        timeEntries.push({
            id: makeId(),
            type, // 'saved' or 'used'
            desc,
            amount,
            unit,
            dimensions: dimensions.length ? dimensions : undefined,
        });

        timeDescInput.value = '';
        timeAmountInput.value = '';
        timeDescInput.focus();
        saveTimeState();

        // Prime to cauldron — now carries higher-order dimensions when present
        try {
            const bus = window.__SPW_SITE__?.bus || (window.bus);
            if (bus && typeof bus.emit === 'function') {
                const dimPart = dimensions.length ? '-dims-' + dimensions.map(d => d.slice(0, 12).replace(/\s+/g, '-')).join('+') : '';
                const expr = `${amount}-${unit}-time-${type}${dimPart}`;
                bus.emit('spell:capture', {
                    expression: expr,
                    label: `${desc} (${amount} ${unit} ${type}${dimensions.length ? ' — ' + dimensions.join(' + ') : ''})`,
                    type: 'numerical',
                    value: amount,
                    unit: `${unit}-${type}`,
                    origin: 'budgeting-tool-time',
                    wonder: dimensions.length ? 'higher-order-capacity' : 'rhythm-capacity',
                    primedBy: 'time-prime',
                    dimensions: dimensions.length ? dimensions : undefined,
                    higherOrder: dimensions.length > 1,
                });
            }
        } catch (_) {}
    }

    function removeTimeEntry(id) {
        timeEntries = timeEntries.filter(e => e.id !== id);
        saveTimeState();
    }

    function normalizeToHours(entry) {
        const { amount, unit } = entry;
        if (unit === 'hours') return amount;
        if (unit === 'days') return amount * 8; // assume 8h day for capacity mapping
        if (unit === 'cycles') return amount * 40; // rough 13-cycle ~ 5 days * 8h
        return amount;
    }

    function buildTimeEntryNode(entry) {
        const item = document.createElement('li');
        item.className = 'budget-item time-item';
        item.dataset.type = entry.type;
        item.dataset.unit = entry.unit;

        const content = document.createElement('div');
        content.className = 'budget-item__content';

        const title = document.createElement('strong');
        title.textContent = entry.desc;

        const amt = document.createElement('span');
        amt.className = 'budget-item__amount time-amount';
        const sign = entry.type === 'saved' ? '+' : '-';
        amt.textContent = `${sign}${entry.amount} ${entry.unit}`;

        // Make time amounts living/numericity-aware for the mode + cauldron
        if (document.documentElement.dataset.spwNumericityEmphasis && document.documentElement.dataset.spwNumericityEmphasis !== 'subtle') {
            amt.classList.add('spw-living-term');
            amt.setAttribute('data-spw-living-term', '');
            amt.setAttribute('data-spw-concept', `time-${entry.unit}`);
            amt.setAttribute('data-spw-numericity', 'rhythm');
            amt.setAttribute('tabindex', '0');
            amt.setAttribute('data-spw-gesture-contract', 'tap:prime hold:cauldron-capture');
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'budget-item__remove';
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.setAttribute('aria-label', `Remove ${entry.desc}`);
        removeBtn.addEventListener('click', () => removeTimeEntry(entry.id));

        // Higher-order dimensions on time entries (rendered consistently with money path)
        const timeDims = entry.dimensions && entry.dimensions.length ? entry.dimensions : [];
        if (timeDims.length) {
            const dimContainer = document.createElement('span');
            dimContainer.className = 'budget-item__dimensions';
            timeDims.forEach((dim, idx) => {
                const dimEl = document.createElement('span');
                dimEl.className = 'budget-item__motive budget-item__dimension';
                dimEl.setAttribute('data-spw-vocabulary-term', '');
                dimEl.setAttribute('data-spw-operator', idx === 0 ? 'object' : 'topic');
                dimEl.textContent = dim;
                dimEl.title = 'Higher-order time resource dimension';
                dimContainer.append(dimEl);
            });
            content.append(title, amt, dimContainer);
        } else {
            content.append(title, amt);
        }

        // Prime button for direct cauldron capture — carries higher-order when present
        const primeBtn = document.createElement('button');
        primeBtn.className = 'budget-item__prime operator-chip';
        primeBtn.type = 'button';
        primeBtn.textContent = 'prime to cauldron';
        primeBtn.addEventListener('click', () => {
            try {
                const bus = window.__SPW_SITE__?.bus;
                if (bus) {
                    const dimPart = timeDims.length ? '-dims-' + timeDims.map(d => d.slice(0, 12).replace(/\s+/g, '-')).join('+') : '';
                    const expr = `${entry.amount}-${entry.unit}-time-${entry.type}${dimPart}`;
                    bus.emit('spell:capture', {
                        expression: expr,
                        label: `${entry.desc} (${entry.amount} ${entry.unit} ${entry.type}${timeDims.length ? ' — ' + timeDims.join(' + ') : ''})`,
                        type: 'numerical',
                        value: entry.amount,
                        unit: `${entry.unit}-${entry.type}`,
                        origin: 'budgeting-tool-time',
                        wonder: timeDims.length ? 'higher-order-capacity' : 'rhythm-capacity',
                        primedBy: 'time-prime',
                        dimensions: timeDims.length ? timeDims : undefined,
                        higherOrder: timeDims.length > 1,
                    });
                }
            } catch (_) {}
        });

        item.append(content, removeBtn, primeBtn);
        return item;
    }

    function renderTime() {
        const items = timeEntries.map(buildTimeEntryNode);
        const totalHours = timeEntries.reduce((sum, e) => {
            return sum + (e.type === 'saved' ? normalizeToHours(e) : -normalizeToHours(e));
        }, 0);

        timeEntriesList.replaceChildren(...(items.length ? items : [buildEmptyNodeForTime()]));

        timeTotalDisplay.textContent = `${totalHours.toFixed(1)} hours equiv.`;

        // Simple time affordance message (extendable to rhythm-mapped tiers)
        if (totalHours > 120) {
            timeMessageEl.textContent = 'Significant time capacity. Multiple rhythmic cycles of deep work are banked.';
        } else if (totalHours > 40) {
            timeMessageEl.textContent = 'A full 13-cycle block of focused capacity is available.';
        } else if (totalHours > 0) {
            timeMessageEl.textContent = `${totalHours.toFixed(0)} hours of protected time saved. Allocate deliberately across your release rhythm.`;
        } else {
            timeMessageEl.textContent = 'Track saved focus time to see what rhythm-aligned work becomes possible.';
        }

        // Expose to numericity mode / cauldron mirrors if active
        try {
            document.documentElement.dataset.spwTimeCapacityHours = totalHours.toFixed(1);
        } catch (_) {}
    }

    function buildEmptyNodeForTime() {
        const empty = document.createElement('li');
        empty.className = 'budget-empty';
        empty.textContent = 'No time entries yet. Log saved focus blocks or allocated time.';
        return empty;
    }

    btnTimeSaved.addEventListener('click', () => addTimeEntry('saved'));
    btnTimeUsed.addEventListener('click', () => addTimeEntry('used'));

    [timeDescInput, timeAmountInput].forEach((input) => {
        input.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            addTimeEntry('saved');
        });
    });

    loadTimeState();

    loadState();

    // Progressive macro indicator (improves discoverability of the higher-order query string capability)
    if (appliedMacro && appliedMacro.dimensions && appliedMacro.dimensions.length) {
        const capacityPanel = document.getElementById('capacity');
        if (capacityPanel) {
            const indicator = document.createElement('div');
            indicator.className = 'budget-macro-indicator spec-pill';
            indicator.setAttribute('data-spw-vocabulary-term', '');
            indicator.textContent = `macro: ${appliedMacro.dimensions.join(' + ')}`;
            indicator.title = 'Loaded from query string — higher-order resource model (shareable)';
            // Place it near the top of the capacity panel for visibility without clutter
            const header = capacityPanel.querySelector('.frame-heading');
            if (header) header.after(indicator);
            else capacityPanel.prepend(indicator);
        }
    }
});
