/**
 * Physical Model — Unified Spw Physics Surface
 *
 * Purpose
 * - Bridge and unify the site's distinct physical dynamics into a cohesive,
 *   inspectable runtime model:
 *   1. Spatial Gravity: viewport room, extent, vertical & horizontal biases.
 *   2. Electrostatic Charge & Discharge: carrier, phase intensity, relation rewards.
 *   3. Pulse & Cadence: 13-beat cadence, prime beats, freshness pulses.
 *   4. Wonder Resonance: memory state, cognitive familiarity, liminality, field balance.
 *   5. Developmental Climate: atmospheric weather, learning modes, recipe biases.
 *   6. Attentive Presence: arrival steps, presence states, interaction loops.
 *
 * Philosophy
 * - Physics is inspectable from the document outward: data attributes hold
 *   discrete categorical states; CSS custom properties hold smooth continuous
 *   forces; JavaScript coordinates transitions and event broadcasts.
 */

import { describeChargeFieldState, SPW_CHARGE_FIELD_CONTRACT } from "./charge-field.js";
import { describePulseBeatTunerState, SPW_PULSE_BEAT_TUNER_CONTRACT } from "./pulse-beat-tuner.js";
import { describeWonderMemorySnapshot, SPW_WONDER_MEMORY_CONTRACT } from "../interface/wonder-memory.js";
import { describeDevelopmentalClimate, SPW_DEVELOPMENTAL_CLIMATE_CONTRACT } from "../interface/developmental-climate.js";
import { SPW_SPATIAL_GRAVITY_CONTRACT } from "./spatial-gravity.js";

export const SPW_PHYSICAL_MODEL_CONTRACT = Object.freeze({
  writable: false,
  layers: Object.freeze({
    spatial: "spatial-gravity",
    charge: "charge-field",
    rhythm: "pulse-beat-tuner",
    wonder: "wonder-memory",
    climate: "developmental-climate",
  }),
  contracts: Object.freeze({
    spatial: SPW_SPATIAL_GRAVITY_CONTRACT,
    charge: SPW_CHARGE_FIELD_CONTRACT,
    rhythm: SPW_PULSE_BEAT_TUNER_CONTRACT,
    wonder: SPW_WONDER_MEMORY_CONTRACT,
    climate: SPW_DEVELOPMENTAL_CLIMATE_CONTRACT,
  }),
  portableUse:
    "Read-only inspection. snapshotPhysicalModel() / describePhysicalModelSummary() gather spatial gravity, charge, beat, wonder, and climate. Do not write physics from this module; a hydrated Spw string still precipitates into those existing engines.",
});

function readNumberProperty(style, name, fallback = 0) {
  if (!style) return fallback;
  const raw = style.getPropertyValue(name).trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolvePageDocument(root) {
  if (root?.nodeType === 9) return root;
  if (root?.ownerDocument) return root.ownerDocument;
  if (typeof document !== "undefined") return document;
  return null;
}

export function snapshotPhysicalModel(root = typeof document !== "undefined" ? document : null) {
  const doc = resolvePageDocument(root);
  const html = doc?.documentElement || null;
  const body = doc?.body || null;
  const style = html && typeof getComputedStyle === "function" ? getComputedStyle(html) : null;

  const spatial = {
    edgeGravity: html?.dataset?.spwEdgeGravity || "none",
    verticalGravity: html?.dataset?.spwVerticalGravity || "balanced",
    horizontalGravity: html?.dataset?.spwHorizontalGravity || "balanced",
    extent: html?.dataset?.spwExtent || "contained",
    measureBand: html?.dataset?.spwMeasureBand || "balanced",
    spaceVariant: html?.dataset?.spwSpaceVariant || "balanced-contained-balanced",
    salienceRank: html?.dataset?.spwSalienceRank || "ambient",
    roomAbove: readNumberProperty(style, "--spw-room-above", 0),
    roomBelow: readNumberProperty(style, "--spw-room-below", 0),
    edgeProximity: readNumberProperty(style, "--spw-edge-proximity", 0),
    verticalBias: readNumberProperty(style, "--spw-vertical-bias", 0),
    horizontalBias: readNumberProperty(style, "--spw-horizontal-bias", 0),
  };

  const charge = describeChargeFieldState(doc);
  const rhythm = describePulseBeatTunerState(doc);
  const wonder = describeWonderMemorySnapshot(doc);
  const climate = describeDevelopmentalClimate();

  const attention = {
    arrival: html?.dataset?.spwPageArrival || "settled",
    presence: html?.dataset?.spwPagePresence || "present",
    attention: html?.dataset?.spwPageAttention || "ambient",
    liminality: body?.dataset?.spwLiminality || "settled",
    climateId: climate.id,
  };

  return {
    spatial,
    charge,
    rhythm,
    wonder,
    climate,
    attention,
  };
}

export function describePhysicalModelSummary(snapshot = snapshotPhysicalModel()) {
  const { spatial, charge, rhythm, wonder, climate } = snapshot;
  const spatialSummary = `${spatial.measureBand}-${spatial.extent}-${spatial.verticalGravity}`;
  const chargeSummary = `${charge.field} (${charge.intensity.toFixed(2)})${charge.carrier ? ` via ${charge.carrier}` : ""}`;
  const rhythmSummary = `beat ${rhythm.currentBeat}${rhythm.isPrime ? " (prime)" : ""}`;
  const wonderSummary = `${wonder.wonder || "latent"} [${wonder.familiarity}/${wonder.liminality}]`;
  const climateSummary = `${climate.id} (${climate.authorLabel})`;

  return `Physics [spatial: ${spatialSummary} | charge: ${chargeSummary} | rhythm: ${rhythmSummary} | wonder: ${wonderSummary} | climate: ${climateSummary}]`;
}
