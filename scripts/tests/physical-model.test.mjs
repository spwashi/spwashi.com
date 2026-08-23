import test from "node:test";
import assert from "node:assert/strict";

import {
  snapshotPhysicalModel,
  describePhysicalModelSummary,
  SPW_PHYSICAL_MODEL_CONTRACT,
} from "../../public/js/runtime/physical-model.js";

import {
  buildRegionProfile,
  describeRegionProfile,
  SPW_REGION_PROFILER_CONTRACT,
} from "../../public/js/runtime/region-profiler.js";

import {
  describeRegionKin,
  SPW_REGION_KIN_CONTRACT,
  pickRegionKin,
} from "../../public/js/runtime/region-kin.js";

import {
  describeChargeFieldState,
  SPW_CHARGE_FIELD_CONTRACT,
} from "../../public/js/runtime/charge-field.js";

import {
  describePulseBeatTunerState,
  SPW_PULSE_BEAT_TUNER_CONTRACT,
} from "../../public/js/runtime/pulse-beat-tuner.js";

import {
  describeDevelopmentalClimate,
  SPW_DEVELOPMENTAL_CLIMATE_CONTRACT,
} from "../../public/js/interface/developmental-climate.js";

import {
  describeWonderMemorySnapshot,
  SPW_WONDER_MEMORY_CONTRACT,
} from "../../public/js/interface/wonder-memory.js";

import {
  describeCanvasAccentInstance,
  SPW_CANVAS_ACCENTS_CONTRACT,
} from "../../public/js/interface/canvas-accents.js";

import {
  initSpwHeroKineticStage,
  SPW_HERO_KINETIC_STAGE_CONTRACT,
} from "../../public/js/runtime/spw-hero-kinetic-stage.js";

test("physical model snapshot returns cohesive physics slices", () => {
  const snapshot = snapshotPhysicalModel(document);
  assert.ok(snapshot.spatial);
  assert.ok(snapshot.charge);
  assert.ok(snapshot.rhythm);
  assert.ok(snapshot.wonder);
  assert.ok(snapshot.climate);
  assert.ok(snapshot.attention);

  assert.equal(typeof snapshot.spatial.verticalGravity, "string");
  assert.equal(typeof snapshot.charge.intensity, "number");
  assert.equal(typeof snapshot.rhythm.currentBeat, "number");
  assert.equal(typeof snapshot.wonder.state, "string");
  assert.equal(typeof snapshot.climate.id, "string");
});

test("physical model summary formats readable physics overview", () => {
  const summary = describePhysicalModelSummary();
  assert.ok(summary.startsWith("Physics ["));
  assert.ok(summary.includes("spatial:"));
  assert.ok(summary.includes("charge:"));
  assert.ok(summary.includes("rhythm:"));
  assert.ok(summary.includes("wonder:"));
  assert.ok(summary.includes("climate:"));
});

test("physical model contract holds layer references and contracts", () => {
  assert.equal(SPW_PHYSICAL_MODEL_CONTRACT.writable, false);
  assert.equal(SPW_PHYSICAL_MODEL_CONTRACT.layers.spatial, "spatial-gravity");
  assert.equal(SPW_PHYSICAL_MODEL_CONTRACT.layers.charge, "charge-field");
  assert.equal(SPW_PHYSICAL_MODEL_CONTRACT.layers.rhythm, "pulse-beat-tuner");
  assert.equal(SPW_PHYSICAL_MODEL_CONTRACT.layers.wonder, "wonder-memory");
  assert.equal(SPW_PHYSICAL_MODEL_CONTRACT.layers.climate, "developmental-climate");
});

test("region profiler describes seats without a personality attribute family", () => {
  const fakeEl = {
    id: "hero-frame",
    dataset: {},
    classList: { contains: (cls) => cls === "site-hero" },
    getAttribute: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    matches: (sel) => sel === "section",
    closest: () => null,
  };

  const profile = buildRegionProfile(fakeEl, 0);
  assert.equal(profile.personality, undefined);
  assert.equal(profile.voice, undefined);
  assert.equal(profile.gravityAxis, undefined);

  const desc = describeRegionProfile(profile);
  assert.equal(desc.key, "hero-frame");
  assert.ok(desc.kind);
  assert.equal(desc.personality, undefined);
  assert.equal(SPW_REGION_PROFILER_CONTRACT.personalityAttributes, undefined);
});

test("region kin describes kin relations and exports contract", () => {
  const a = { id: "a", seat: "hook", operator: "frame", wonder: "" };
  const b = { id: "b", seat: "hook", operator: "probe", wonder: "" };
  const kin = pickRegionKin(a, [a, b]);
  const desc = describeRegionKin(kin);
  assert.equal(desc.similarId, "b");
  assert.equal(desc.hasKin, true);
  assert.ok(SPW_REGION_KIN_CONTRACT.moves.similar);
  assert.ok(SPW_REGION_KIN_CONTRACT.moves.contrast);
  assert.ok(SPW_REGION_KIN_CONTRACT.moves.resonate);
});

test("charge field state and contract are well-formed", () => {
  const state = describeChargeFieldState(document);
  assert.equal(typeof state.field, "string");
  assert.equal(typeof state.intensity, "number");
  assert.ok(SPW_CHARGE_FIELD_CONTRACT.phases.length > 0);
});

test("pulse beat tuner state and contract are well-formed", () => {
  const state = describePulseBeatTunerState(document);
  assert.equal(typeof state.currentBeat, "number");
  assert.equal(typeof state.isPrime, "boolean");
  assert.equal(SPW_PULSE_BEAT_TUNER_CONTRACT.cadence, 13);
});

test("developmental climate descriptor and contract are well-formed", () => {
  const climate = describeDevelopmentalClimate("orient");
  assert.equal(climate.id, "orient");
  assert.equal(climate.label, "kindle");
  assert.equal(climate.learningMode, "entry");
  assert.ok(SPW_DEVELOPMENTAL_CLIMATE_CONTRACT.climates.length >= 5);
});

test("wonder memory snapshot and contract are well-formed", () => {
  const snapshot = describeWonderMemorySnapshot(document);
  assert.ok(snapshot.state);
  assert.ok(SPW_WONDER_MEMORY_CONTRACT.attributes.state);
});

test("canvas accents instance descriptor and contract are well-formed", () => {
  const desc = describeCanvasAccentInstance({
    destroyed: false,
    type: "lattice",
    points: [{ x: 0, y: 0 }],
    particles: [],
    resolvedPalette: ["teal"],
    visible: true,
    charge: 0,
    brushMode: false,
  });
  assert.equal(desc.active, true);
  assert.equal(desc.type, "lattice");
  assert.equal(desc.pointsCount, 1);
  assert.ok(SPW_CANVAS_ACCENTS_CONTRACT.archetypes.includes("lattice"));
});

test("hero kinetic stage supports teardown", () => {
  const teardown = initSpwHeroKineticStage(document);
  assert.equal(typeof teardown, "function");
  teardown();
  assert.equal(SPW_HERO_KINETIC_STAGE_CONTRACT.featureId, "spw-hero-kinetic-stage");
});
