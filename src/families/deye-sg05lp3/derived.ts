import { metric, sumOf } from "@sunreye/profile-sdk";

/**
 * Computed metrics — no registers of their own. **Order matters here and only
 * here:** a `computeExpr` may reference another *computed* metric only if that
 * one is defined earlier in the final list (the SDK rejects a forward reference
 * to a computed key). Register-backed keys can be referenced from anywhere, so
 * `battery.power` and `ac.ups.total_power` resolving from other files is fine.
 */
export const derived = [
  // Declare intent — "sum every PV-string power" — not a hand-listed key set.
  // Resolved against the final metric set at build time, so a variant that adds
  // or drops a string re-derives the correct total with no per-model patch.
  metric("dc/total_power", {
    label: "DC Total Power",
    unit: "W",
    group: "inverter",
    role: "pv.total.power",
    computeExpr: sumOf({ role: "pv.string.power" }),
    deadband: 20,
  }),
  // Power the inverter consumes for itself (conversion losses + standby draw),
  // from the node balance: everything flowing in minus what reaches the load.
  // Battery and grid fold in with their signed conventions (battery +discharge
  // / −charge, grid +import / −export), so charging and export subtract on their
  // own. Depends on the computed dc.total_power above, so it stays after it.
  metric("inverter/power", {
    label: "Inverter Self-Consumption",
    unit: "W",
    group: "inverter",
    role: "inverter.power",
    computeExpr: {
      combine: {
        add: ["dc.total_power", "battery.power", "ac.total_power"],
        sub: ["ac.ups.total_power"],
      },
    },
    deadband: 20,
  }),
  // Directional power splits — the signed battery/grid registers broken into
  // positive-only components so the efficiency ratio (below) can sum true
  // inflows and outflows instead of a signed mix. `clamp {min:0}` keeps the
  // positive part; the opposite direction is `that − signed` (a diff), e.g.
  // charge = discharge − battery.power = max(0, −battery.power).
  metric("grid/import_power", {
    label: "Grid Import Power",
    unit: "W",
    group: "grid",
    computeExpr: { clamp: { key: "ac.total_power", min: 0 } },
    kind: "measurement",
    deadband: 20,
  }),
  metric("grid/export_power", {
    label: "Grid Export Power",
    unit: "W",
    group: "grid",
    computeExpr: { diff: ["grid.import_power", "ac.total_power"] },
    kind: "measurement",
    deadband: 20,
  }),
  metric("battery/discharge_power", {
    label: "Battery Discharge Power",
    unit: "W",
    group: "battery",
    computeExpr: { clamp: { key: "battery.power", min: 0 } },
    kind: "measurement",
    deadband: 20,
  }),
  metric("battery/charge_power", {
    label: "Battery Charge Power",
    unit: "W",
    group: "battery",
    computeExpr: { diff: ["battery.discharge_power", "battery.power"] },
    kind: "measurement",
    deadband: 20,
  }),
  // Inverter conversion efficiency = useful power delivered ÷ power drawn in,
  // both as positive-only sums so charging / exporting count as OUTPUT rather
  // than shrinking the input (the bug in the old signed denominator):
  //   out = load + battery charge + grid export
  //   in  = PV   + battery discharge + grid import
  // A zero denominator (night / idle) reads as 0 rather than dividing by zero;
  // conversion losses keep the ratio ≤ 100 %.
  metric("inverter/efficiency", {
    label: "Inverter Efficiency",
    unit: "%",
    group: "inverter",
    role: "inverter.efficiency",
    kind: "measurement",
    range: { min: 0, max: 100 },
    computeExpr: {
      ratio: {
        num: ["ac.ups.total_power", "battery.charge_power", "grid.export_power"],
        den: ["dc.total_power", "battery.discharge_power", "grid.import_power"],
        scale: 100,
      },
    },
    deadband: 1,
  }),
];
