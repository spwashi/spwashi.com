export const RPG_STATE_CHANGE_EVENT = 'spw:rpg-state-change';

export const RPG_CURATOR_ROUTES = {
    hub: '/play/rpg-wednesday/',
    language: '/play/rpg-wednesday/#language-evolution',
    kit: '/play/rpg-wednesday/#local-gameplay-kit',
    curator: '/play/rpg-wednesday/#rpgw-state-curator',
    ladder: '/play/rpg-wednesday/#rpgw-promotion-ladder',
    character: '/play/rpg-wednesday/character/#character-development',
    world: '/play/rpg-wednesday/world/#world-slots',
    sessions: '/play/rpg-wednesday/sessions/',
    cast: '/play/rpg-wednesday/cast/',
    library: '/play/rpg-wednesday/library/',
    fiber: '/blog/#fiber-linguistics',
    settings: '/settings/'
};

export const RPG_WORKBENCH_COPY = {
    storageUnavailable: 'Local storage is unavailable in this browser. Drafts stay in memory until you leave the page.',
    curatorIntro: 'A register board for this browser\'s table memory: language posture, character deck, world slots, and kit lanes. Counts refresh when any workbench saves here.',
    curatorBenchRule: 'Scratch stays private. Resonance earns a brief. Grammar earns handles. Canon earns repetition. Publication earns proof you can route.',
    curatorStatusTemplate: (actors, clocks, posture, stage) => (
        `Register · ${actors} actors · ${clocks} clocks · posture ${posture} · stage ${stage}`
    ),
    promotionConveyor: 'Promotion conveyor',
    routeManifold: 'Route manifold',
    kitIntro: 'Private table state for this browser. It persists locally, is not published, and never syncs unless you export it.',
    kitBenchRule: 'Scene and clocks stay live · notes stay scratch · beats and canon earn promotion · the brief is what you export',
    languageIntro: 'Three postures on one seed. Compose a brief, then route it through the promotion manifold—like tensioning a small workshop press.',
    languageBenchRule: 'Linguistics names signal · storytelling names pressure · communication names channel and proof',
    languageBriefNote: 'Scratch stays private. Grammar and canon need repetition. Publication needs evidence and a route that survives read-aloud or screenshot.',
    promotionManifold: 'Promotion manifold',
    characterIntro: 'Build one person at a time. Start with a name and portrait, then add development vectors and literacies that help the table recognize a specific individual.',
    characterBenchRule: 'Name and face first · hook carries pressure · a language brief can land in the hook from the evolution bench',
    worldIntro: 'Draft places, factions, rules, and analog mechanisms before they earn public world copy. Import from canon when the table has already named pressure; promote back when the mechanism repeats.',
    worldBenchRule: 'Place anchors geography · faction names pressure · rule names mechanism · analog names comparison',
    ladderNote: 'Cross-route rule: language evolution, character hooks, and world slots can write into the local kit even off the hub. The curator refreshes whenever any RPG surface saves in this browser.'
};

export const workbenchLegendHtml = (label, body) => `<strong>${label}</strong> ${body}`;

export const notifyRpgStateChange = (source = 'rpg') => {
    document.dispatchEvent(new CustomEvent(RPG_STATE_CHANGE_EVENT, { detail: { source } }));
};