const STORAGE_KEY = 'spw-budget-state:v1';
const MAX_TIER_COST = 15000;
const TIERS = [
    {
        id: 'creator',
        cost: 400,
        color: 'var(--op-topic-color, #2f8f6b)',
        message: 'Creator packages are now within reach.',
    },
    {
        id: 'business',
        cost: 3500,
        color: 'var(--op-frame-color, #1a9999)',
        message: 'Business Web is now within reach.',
    },
    {
        id: 'premium',
        cost: 15000,
        color: 'var(--op-probe-color, #6b4bb6)',
        message: 'Staff-level consulting is now within reach.',
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
        if (!Number.isFinite(amount) || amount <= 0) {
            amountInput.focus();
            return;
        }

        entries.push({
            id: makeId(),
            type,
            desc,
            amount,
        });

        descInput.value = '';
        amountInput.value = '';
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

        amount.className = 'budget-item-amount';
        amount.textContent = `${sign}${formatCurrency(entry.amount)}`;

        return amount;
    }

    function buildEntryNode(entry) {
        const item = document.createElement('li');
        const copy = document.createElement('div');
        const title = document.createElement('strong');
        const amount = buildAmountNode(entry);
        const removeButton = document.createElement('button');

        item.className = 'budget-item';
        item.dataset.type = entry.type;

        copy.className = 'budget-item-copy';
        title.textContent = entry.desc;

        removeButton.className = 'budget-item-remove';
        removeButton.type = 'button';
        removeButton.textContent = '×';
        removeButton.setAttribute('aria-label', `Remove ${entry.desc}`);
        removeButton.addEventListener('click', () => removeEntry(entry.id));

        copy.append(title, amount);
        item.append(copy, removeButton);

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

    function setTierMessage(text, color) {
        messageEl.textContent = text;
        messageEl.style.color = color;
    }

    function updateDashboard(netValue) {
        const clampedValue = Math.max(0, netValue);
        const percent = Math.min((clampedValue / MAX_TIER_COST) * 100, 100);
        const nextTier = TIERS.find((tier) => netValue < tier.cost) || null;

        progressBar.style.width = `${percent}%`;
        totalDisplay.textContent = formatCurrency(netValue);

        if (netValue < 0) {
            setTierMessage(`You are ${formatCurrency(Math.abs(netValue))} below zero. Restore baseline first, then map the next threshold.`, 'var(--op-object-color, #bd7f23)');
        } else if (!nextTier) {
            setTierMessage('Staff-level consulting is within reach. You can plan around architecture or diligence instead of only the minimum viable scope.', 'var(--op-probe-color, #6b4bb6)');
        } else if (nextTier.id === 'creator') {
            setTierMessage(`Need ${formatCurrency(nextTier.cost - netValue)} more to reach creator packages.`, 'var(--ink-soft, rgba(18, 36, 32, 0.68))');
        } else {
            const unlockedTier = TIERS[TIERS.findIndex((tier) => tier.id === nextTier.id) - 1];
            setTierMessage(`${unlockedTier.message} ${formatCurrency(nextTier.cost - netValue)} more reaches ${nextTier.id === 'business' ? 'Business Web' : 'staff-level consulting'}.`, unlockedTier.color);
        }

        tierCards.forEach((card) => {
            const cost = Number.parseInt(card.dataset.cost || '0', 10);
            card.classList.toggle('is-unlocked', netValue >= cost);
        });
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

    loadState();
});
