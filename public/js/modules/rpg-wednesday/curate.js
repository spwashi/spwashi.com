import { createCardSigil, createElement, createFrameHeading } from '/public/js/modules/rpg-wednesday/dom.js';
import {
    RPG_CURATOR_ROUTES,
    RPG_STATE_CHANGE_EVENT,
    RPG_WORKBENCH_COPY,
    notifyRpgStateChange,
    workbenchLegendHtml
} from '/public/js/modules/rpg-wednesday/contract.js';
import {
    createCharacterStorage,
    createStorage,
    createWorldSlotStorage,
    previewText,
    readLanguageEvolutionState
} from '/public/js/modules/rpg-wednesday/state.js';

export { RPG_CURATOR_ROUTES, notifyRpgStateChange };

const laneHasText = (value) => Boolean(String(value || '').trim());

const countLines = (value) => (
    String(value || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .length
);

export const readRpgCuratorSnapshot = () => {
    const gameplayStorage = createStorage();
    const characterStorage = createCharacterStorage();
    const worldStorage = createWorldSlotStorage();
    const gameplay = gameplayStorage.read();
    const language = readLanguageEvolutionState();
    const characters = characterStorage.read();
    const worldSlots = worldStorage.read();

    return {
        gameplayAvailable: gameplayStorage.available,
        languageAvailable: Boolean(language.updatedAt || language.seed),
        scene: previewText(gameplay.scene, ''),
        objective: previewText(gameplay.objective, ''),
        lanes: {
            scratch: laneHasText(gameplay.notes),
            beat: countLines(gameplay.characterBeat),
            canon: countLines(gameplay.canonCandidates),
            seeds: countLines(gameplay.seeds),
            fabric: countLines(gameplay.nameFabric)
        },
        table: {
            actors: gameplay.initiative.length,
            clocks: gameplay.clocks.length,
            assets: gameplay.assets.length
        },
        language: {
            posture: language.posture,
            stage: language.stage,
            seed: previewText(language.seed, ''),
            hasBrief: laneHasText(language.seed) || laneHasText(language.gloss) || laneHasText(language.tableMove)
        },
        characters: {
            count: characters.length,
            hooks: characters.filter((item) => laneHasText(item.hook)).length,
            portraits: characters.filter((item) => item.imageKey || item.imageUrl).length
        },
        world: {
            count: worldSlots.length,
            places: worldSlots.filter((item) => item.kind === 'place').length,
            factions: worldSlots.filter((item) => item.kind === 'faction').length,
            rules: worldSlots.filter((item) => item.kind === 'rule' || item.kind === 'analog').length
        }
    };
};

const createStat = (label, value, href, note = '') => {
    const content = [
        createElement('span', { className: 'rpg-curator-widget__stat-label', text: label }),
        createElement('strong', { className: 'rpg-curator-widget__stat-value', text: String(value) })
    ];

    if (note) {
        content.push(createElement('span', { className: 'rpg-curator-widget__stat-note', text: note }));
    }

    const node = href
        ? createElement('a', {
            className: 'rpg-curator-widget__stat',
            href,
            'data-spw-slot': 'stat'
        }, content)
        : createElement('div', {
            className: 'rpg-curator-widget__stat',
            'data-spw-slot': 'stat'
        }, content);

    return node;
};

const sumLaneActivity = (snapshot) => (
    snapshot.lanes.beat
    + snapshot.lanes.canon
    + snapshot.lanes.seeds
    + snapshot.lanes.fabric
    + snapshot.world.count
    + snapshot.characters.count
    + (snapshot.language.hasBrief ? 1 : 0)
);

const syncCuratorAttributes = (widget, snapshot) => {
    const activity = sumLaneActivity(snapshot);
    const density = activity >= 4 ? 'active' : activity >= 1 ? 'warming' : 'quiet';

    widget.dataset.spwCuratorPosture = snapshot.language.posture;
    widget.dataset.spwCuratorStage = snapshot.language.stage;
    widget.dataset.spwCuratorDensity = density;
    document.documentElement.dataset.spwRpgCuratorDensity = density;
};

const createLadderStep = (sigil, label, count, href, active = false) => createElement('a', {
    className: `rpg-promotion-ladder__step${active ? ' is-active' : ''}`,
    href,
    'data-spw-promotion-lane': label,
    title: `${label} lane · ${count} item${count === 1 ? '' : 's'}`
}, [
    createCardSigil(sigil, { className: 'rpg-promotion-ladder__sigil frame-card-sigil' }),
    createElement('span', { className: 'rpg-promotion-ladder__label', text: label }),
    createElement('span', { className: 'rpg-promotion-ladder__count', text: String(count) })
]);

export const ensureRpgCuratorWidget = () => {
    if (document.querySelector('[data-rpg-curator-widget]')) return null;

    const article = document.querySelector('main article');
    if (!article) return null;

    const statsHost = createElement('div', {
        className: 'rpg-curator-widget__stats',
        'aria-label': 'Local RPG state summary'
    });
    const ladderHost = createElement('nav', {
        className: 'rpg-promotion-ladder rpg-promotion-ladder--track',
        'aria-label': 'Promotion ladder'
    });
    const registerHost = createElement('div', {
        className: 'rpg-curator-widget__register'
    });
    const bodyHost = createElement('div', {
        className: 'rpg-curator-widget__body'
    });
    const status = createElement('p', {
        className: 'frame-note rpg-curator-widget__status',
        text: RPG_WORKBENCH_COPY.storageUnavailable
    });

    let widget;

    const refresh = () => {
        const snapshot = readRpgCuratorSnapshot();
        statsHost.replaceChildren(
            createStat('scene', snapshot.scene || '—', RPG_CURATOR_ROUTES.kit),
            createStat('language', snapshot.language.seed || snapshot.language.stage, RPG_CURATOR_ROUTES.language),
            createStat('characters', snapshot.characters.count, RPG_CURATOR_ROUTES.character),
            createStat('world slots', snapshot.world.count, RPG_CURATOR_ROUTES.world),
            createStat('assets', snapshot.table.assets, `${RPG_CURATOR_ROUTES.kit}#rpg-kit-assets`)
        );

        ladderHost.replaceChildren(
            createLadderStep('~', 'scratch', snapshot.lanes.scratch ? 1 : 0, `${RPG_CURATOR_ROUTES.kit}#rpg-kit-notes`),
            createLadderStep('?', 'resonance', snapshot.language.hasBrief ? 1 : 0, RPG_CURATOR_ROUTES.language, snapshot.language.hasBrief),
            createLadderStep('@', 'beat', snapshot.lanes.beat, `${RPG_CURATOR_ROUTES.kit}#rpg-kit-notes`),
            createLadderStep('^', 'canon', snapshot.lanes.canon, `${RPG_CURATOR_ROUTES.kit}#rpg-kit-notes`),
            createLadderStep('~', 'fabric', snapshot.lanes.fabric, `${RPG_CURATOR_ROUTES.kit}#rpg-kit-notes`),
            createLadderStep('#>', 'world', snapshot.world.count, RPG_CURATOR_ROUTES.world),
            createLadderStep('@', 'publish', snapshot.lanes.seeds, `${RPG_CURATOR_ROUTES.kit}#rpg-kit-brief`)
        );

        status.textContent = snapshot.gameplayAvailable
            ? RPG_WORKBENCH_COPY.curatorStatusTemplate(
                snapshot.table.actors,
                snapshot.table.clocks,
                snapshot.language.posture,
                snapshot.language.stage
            )
            : RPG_WORKBENCH_COPY.storageUnavailable;

        if (widget) syncCuratorAttributes(widget, snapshot);
    };

    widget = createElement('aside', {
        className: 'site-frame rpg-curator-widget rpg-workbench rpg-workbench--curator',
        id: 'rpgw-state-curator',
        'data-rpg-curator-widget': 'true',
        'data-spw-feature': 'rpg-state-curator',
        'data-spw-kind': 'frame',
        'data-spw-role': 'guidance',
        'data-spw-context': 'play',
        'data-spw-seed': 'page_play_play_rpg_wednesday__state_curator'
    }, [
        createFrameHeading({
            href: '#rpgw-state-curator',
            sigilText: '~state_curator',
            title: 'State Curator',
            operator: 'ref'
        }),
        createElement('p', {
            className: 'inline-note',
            text: RPG_WORKBENCH_COPY.curatorIntro
        }),
        createElement('p', {
            className: 'rpg-workbench__legend',
            html: workbenchLegendHtml('Bench rule', RPG_WORKBENCH_COPY.curatorBenchRule),
            trusted: true
        }),
        bodyHost,
        status
    ]);

    const routesNav = createElement('nav', {
        className: 'frame-operators rpg-curator-widget__routes',
        'aria-label': 'Curator routes'
    }, [
        createElement('a', { className: 'operator-chip', href: RPG_CURATOR_ROUTES.language, 'data-spw-operator': 'ref', text: '~ language' }),
        createElement('a', { className: 'operator-chip', href: RPG_CURATOR_ROUTES.kit, 'data-spw-operator': 'ref', text: '~ local kit' }),
        createElement('a', { className: 'operator-chip', href: RPG_CURATOR_ROUTES.character, 'data-spw-operator': 'ref', text: '~ character lab' }),
        createElement('a', { className: 'operator-chip', href: RPG_CURATOR_ROUTES.world, 'data-spw-operator': 'object', text: '^ world slots' }),
        createElement('a', { className: 'operator-chip', href: RPG_CURATOR_ROUTES.ladder, 'data-spw-operator': 'probe', text: '? promotion ladder' }),
        createElement('a', { className: 'operator-chip', href: RPG_CURATOR_ROUTES.sessions, 'data-spw-operator': 'ref', text: '~ sessions' }),
        createElement('a', { className: 'operator-chip', href: RPG_CURATOR_ROUTES.library, 'data-spw-operator': 'frame', text: '#> library' }),
        createElement('a', { className: 'operator-chip', href: RPG_CURATOR_ROUTES.fiber, 'data-spw-operator': 'ref', text: '~ fiber × language' }),
        createElement('a', { className: 'operator-chip', href: RPG_CURATOR_ROUTES.settings, 'data-spw-operator': 'probe', text: '? settings' })
    ]);

    registerHost.append(
        statsHost,
        createElement('p', { className: 'frame-note', text: RPG_WORKBENCH_COPY.promotionConveyor }),
        ladderHost
    );
    bodyHost.append(
        registerHost,
        createElement('div', { className: 'rpg-curator-widget__routes-panel' }, [
            createElement('p', { className: 'frame-note', text: RPG_WORKBENCH_COPY.routeManifold }),
            routesNav
        ])
    );

    const mountAfter = document.querySelector('[data-rpg-mode-widget]')
        || article.querySelector('.site-hero');
    if (mountAfter?.parentElement === article) {
        mountAfter.insertAdjacentElement('afterend', widget);
    } else {
        article.prepend(widget);
    }

    const handleRefresh = () => refresh();
    document.addEventListener(RPG_STATE_CHANGE_EVENT, handleRefresh);
    refresh();

    return {
        refresh,
        destroy: () => {
            document.removeEventListener(RPG_STATE_CHANGE_EVENT, handleRefresh);
            widget.remove();
        }
    };
};
