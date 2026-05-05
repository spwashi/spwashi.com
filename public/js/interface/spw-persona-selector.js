import { bus } from '/public/js/kernel/spw-bus.js';

let isBuilt = false;
const chipButtons = {};

export function initPersonaSelector() {
    let mount = document.querySelector('[data-spw-surface="personas"]');
    if (!mount) {
        const header = document.querySelector('header');
        mount = document.createElement('div');
        mount.setAttribute('data-spw-surface', 'personas');
        mount.className = 'persona-selector-mount';
        if (header) {
            header.appendChild(mount);
        } else {
            document.body.appendChild(mount);
        }
    }

    if (!isBuilt) {
        buildSelector(mount);
        isBuilt = true;
    }

    updateSelector();
    bus.on('persona:active', updateSelector);
}

function buildSelector(mount) {
    const frame = document.createElement('div');
    frame.className = 'persona-selector-frame';
    frame.dataset.spwOperator = 'action';
    frame.dataset.spwForm = 'brace';

    const sigil = document.createElement('span');
    sigil.className = 'frame-sigil';
    sigil.dataset.spwOperator = 'action';
    sigil.textContent = '@personas';

    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'persona-chips';
    chipsContainer.setAttribute('role', 'group');
    chipsContainer.setAttribute('aria-label', 'Select technical lens persona');

    const personas = [
        { id: 'viewer', sigil: '.', label: 'viewer', title: 'Viewer persona: Clean and focused' },
        { id: 'doodler', sigil: '*', label: 'doodler', title: 'Doodler persona: Visual flourishes' },
        { id: 'scribe', sigil: '$', label: 'scribe', title: 'Scribe persona: Technical metadata' }
    ];

    personas.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'persona-chip';
        btn.dataset.persona = p.id;
        btn.title = p.title;
        btn.setAttribute('aria-pressed', 'false');

        const s = document.createElement('span');
        s.className = 'persona-sigil';
        s.textContent = p.sigil;

        btn.appendChild(s);
        btn.appendChild(document.createTextNode(p.label));

        btn.addEventListener('click', () => {
            bus.emit('persona:shift', { persona: p.id });
        });

        chipsContainer.appendChild(btn);
        chipButtons[p.id] = btn;
    });

    frame.appendChild(sigil);
    frame.appendChild(chipsContainer);
    mount.appendChild(frame);
}

function updateSelector() {
    const active = document.body.dataset.spwPersona || 'viewer';

    Object.entries(chipButtons).forEach(([id, btn]) => {
        const isActive = id === active;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });
}