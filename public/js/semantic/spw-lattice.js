/**
 * Spw Lattice & Developmental Cycles
 * 
 * Implements multidimensional concept relationships and alternating salience 
 * cycles. Serializes developmental weights as Spw scripts.
 */

import { getGroundedRegistry } from '/public/js/interface/spw-haptics.js';
import { bus } from '/public/js/kernel/spw-bus.js';

export const LATTICE = {
    'software:Schedulers': { parallels: ['software:Pretext', 'software:Browser', 'science:Resonance'], clusters: ['runtime', 'orchestration'] },
    'software:Compression': { parallels: ['software:Lattices', 'software:Parsers', 'science:Thermodynamics'], clusters: ['data', 'metamorphism'] },
    'software:Pretext': { parallels: ['software:Schedulers', 'software:Layout', 'science:CognitiveFlow'], clusters: ['runtime', 'expressivity'] },
    'software:Lattices': { parallels: ['software:Compression', 'software:Ontology', 'science:SolidState'], clusters: ['data', 'structure'] }
};

const PHASES = ['curiosity', 'competence', 'coherence', 'principal'];
let currentPhaseIndex = 0;

export function initSpwLattice() {
    updateLatticeSalience();

    // Sustained hold on any brace advances the developmental lattice phase
    bus.on('brace:sustained', () => {
        currentPhaseIndex = (currentPhaseIndex + 1) % PHASES.length;
        updateLatticeSalience();
        bus.emit('lattice:cycled', { phase: PHASES[currentPhaseIndex], index: currentPhaseIndex });
        console.log(`@ [lattice] phase shifted to: ${PHASES[currentPhaseIndex]}`);
    });

    // External trigger (e.g. console command) can also advance the cycle
    bus.on('lattice:cycled', (e) => {
        // If another system triggered the cycle with a specific phase, sync to it
        const requestedPhase = e.detail?.phase;
        if (requestedPhase && requestedPhase !== PHASES[currentPhaseIndex]) {
            const idx = PHASES.indexOf(requestedPhase);
            if (idx !== -1) currentPhaseIndex = idx;
            updateLatticeSalience();
        }
    });

    // Charged elements reveal their parallel relationships
    bus.on('brace:charged', (e) => {
        const el = e.target?.closest?.('[id]');
        if (el) highlightParallels(el.id || `${window.location.pathname}:${el.textContent.trim()}`);
    });

    bus.on('brace:discharged', clearParallels);

    // Hover effect for non-brace tokens
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.operator-chip, .syntax-token, .spec-pill');
        if (target && !target.dataset.spwForm) {
            const key = target.id || `${window.location.pathname}:${target.textContent.trim()}`;
            highlightParallels(key);
        }
    });

    document.addEventListener('mouseout', clearParallels);
}

function highlightParallels(key) {
    const data = LATTICE[key];
    if (!data) return;

    data.parallels.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('spw-parallel-shimmer');
    });
}

function clearParallels() {
    document.querySelectorAll('.spw-parallel-shimmer').forEach(el => {
        el.classList.remove('spw-parallel-shimmer');
    });
}

function updateLatticeSalience() {
    const phase = PHASES[currentPhaseIndex];
    document.body.dataset.spwLatticePhase = phase;
    
    // In a real app, this would shift weights in CSS or visibility
    // For now, we update the liminality of clusters
}

export function serializeLatticeToSpw() {
    const registry = getGroundedRegistry();
    let spw = `# [lattice_weights]\n`;
    spw += `@phase .${PHASES[currentPhaseIndex]}\n\n`;

    spw += `^"developmental_matrix"{\n`;
    PHASES.forEach(p => {
        const weight = p === PHASES[currentPhaseIndex] ? 1.0 : 0.2;
        spw += `  ${p}: ${weight}\n`;
    });
    spw += `}\n\n`;

    spw += `#[relationship_parallels]\n`;
    Object.keys(LATTICE).forEach(key => {
        spw += `~"${key}" => [${LATTICE[key].parallels.join(', ')}]\n`;
    });

    if (registry.length) {
        spw += `\n#[grounded_tokens]\n`;
        registry.forEach(key => { spw += `. "${key}"\n`; });
    }

    return spw;
}
