import { defineFamily } from "@sunreye/profile-sdk";
import type { MetricDataDef } from "@sunreye/profile-sdk";

import { battery } from "./deye-sg05lp3/battery";
import { controls } from "./deye-sg05lp3/controls";
import { derived } from "./deye-sg05lp3/derived";
import { generator } from "./deye-sg05lp3/generator";
import { grid } from "./deye-sg05lp3/grid";
import { inverter } from "./deye-sg05lp3/inverter";
import { load } from "./deye-sg05lp3/load";
import { models } from "./deye-sg05lp3/models";
import { settings } from "./deye-sg05lp3/settings";
import { solar } from "./deye-sg05lp3/solar";
import { system } from "./deye-sg05lp3/system";
import { timeOfUse } from "./deye-sg05lp3/time-of-use";

/**
 * Deye / Sunsynk hybrid holding-register map, transcribed from the vendor
 * Modbus documentation. Deye and Sunsynk single-phase/three-phase hybrids share
 * this register layout, so one profile covers both badges.
 *
 * Authored with the inverter-core SDK: `metric(topic, opts)` derives the
 * canonical `key` from the topic (`/` → `.`) and maps each register onto a
 * {@link CanonicalRole} inline, so the role's required shape (index, enumLabels,
 * writability) is checked at compile time.
 *
 * The register map lives in ./deye-sg05lp3/, one file per category, so a new
 * register is a one-file edit and no single file carries the whole vendor map:
 *
 *   inverter.ts     status, relays, temperatures
 *   solar.ts        PV strings + production counters
 *   grid.ts         per-phase AC, CT clamps, import/export counters
 *   battery.ts      pack measurements + energy counters
 *   bms.ts          the pack's own BMS block (10000+) — NOT wired in, see below
 *   generator.ts    generator input ports
 *   load.ts         backup / UPS output
 *   settings.ts     writable settings
 *   system.ts       packed date/time
 *   time-of-use.ts  the 6-slot TOU schedule
 *   derived.ts      computed metrics (order-sensitive — see its header)
 *   controls.ts     composite controls (no registers of their own)
 *   conventions.ts  flow labels + the storage/deadband rationale
 *   keys.ts         the DeyeKey union
 *   models.ts       per-SKU overlays
 *
 * Only ./deye-sg05lp3/derived.ts is order-sensitive; every other table is a flat
 * list and the order below is just a reading order.
 *
 * `bms` is deliberately absent from the list. Its registers live at 10000+, so
 * including it adds a fourth read block 9300 registers past every other one, and
 * this hardware does not answer it — the poll times out. The transport's
 * split-and-remember fallback only covers Modbus exception 2 (illegal data
 * address); a device that stays silent has no fallback. The module is kept
 * because the addresses are transcribed and verified; re-add `...bms` here once
 * a probe shows the range responds.
 */
export { models } from "./deye-sg05lp3/models";
export type { DeyeKey } from "./deye-sg05lp3/keys";

/** The full Deye / Sunsynk register + semantic map. */
export const metrics: MetricDataDef[] = [
  ...inverter,
  ...solar,
  ...grid,
  ...battery,
  ...generator,
  ...load,
  ...settings,
  ...system,
  ...timeOfUse,
  ...derived,
  ...controls,
];

export const deyeSG05LP3 = defineFamily({
  id: "deye-sg05lp3",
  name: "SG05LP3",
  manufacturer: "Deye",
  version: "1.0.0",
  metrics,
  models,
});
