import { metric } from "@sunreye/profile-sdk";
import { CHARGE_FLOW } from "./conventions";

/**
 * Deye battery read-only area (BMS pack 1), doc v105.4 section 4 —
 * "德业电池只读区 (低压三相、低压单相) / LV single/three phase inverter", which is
 * the section that applies to this family. (Sections 5.4.1/5.4.2 at the same
 * addresses are the 高压三相 / HV three-phase tables and do NOT apply here.)
 *
 * These registers are what the connected pack reports over its BMS link, as
 * opposed to what the inverter measures at its own terminals (587/590/591), so
 * they read zero unless a Deye-protocol lithium pack is wired and talking.
 * Group `battery` so they land beside the inverter-side battery metrics; every
 * label is prefixed "BMS" to keep the two sources apart in the UI.
 *
 * Only pack 1 is mapped. The doc describes further packs as "8 SN + 22 data
 * registers = 30 registers" per pack without giving pack 2's start address, and
 * pack 1's own SN block (10032-10039) overlaps that stride — so the stride is
 * ambiguous and a guessed base address would read another pack's field.
 *
 * Two fields the doc leaves unstated, flagged rather than silently assumed:
 *   - 10004 current: no S16 note, unlike 591 which the doc marks S16. Mapped
 *     signed because a pack current must represent both directions; verify
 *     against a live charge reading before trusting the sign.
 *   - 10008 temperature: 0.1 ℃ with no offset, unlike 586 (0.1 ℃, offset -100).
 *     Taken at face value; a reading near 1000 at room temperature means it
 *     carries the same +100 ℃ bias and needs `offset: -100`.
 */
export const bms = [
  metric("bms/device_type", {
    label: "BMS Device Type",
    group: "battery",
    addr: 10000,
    kind: "status",
    storage: "config",
  }),
  metric("bms/protocol_version", {
    label: "BMS Protocol Version",
    group: "battery",
    addr: 10001,
    kind: "status",
    storage: "config",
  }),
  metric("bms/pack_count", {
    label: "BMS Pack Count",
    group: "battery",
    addr: 10002,
    kind: "status",
    storage: "config",
  }),
  metric("bms/voltage", {
    label: "BMS Battery Voltage",
    unit: "V",
    group: "battery",
    addr: 10003,
    scale: 0.1,
    kind: "measurement",
    deadband: 0.1,
  }),
  metric("bms/current", {
    label: "BMS Battery Current",
    unit: "A",
    group: "battery",
    type: "S_WORD",
    addr: 10004,
    scale: 0.1,
    kind: "measurement",
    flow: CHARGE_FLOW,
    deadband: 0.2,
  }),
  metric("bms/soc", {
    label: "BMS State of Charge",
    unit: "%",
    group: "battery",
    addr: 10005,
    kind: "measurement",
    range: { min: 0, max: 100 },
  }),
  metric("bms/soh", {
    label: "BMS State of Health",
    unit: "%",
    group: "battery",
    addr: 10006,
    kind: "measurement",
    storage: "config",
    range: { min: 0, max: 100 },
  }),
  metric("bms/remaining_capacity", {
    label: "BMS Remaining Capacity",
    unit: "Ah",
    group: "battery",
    addr: 10007,
    kind: "measurement",
  }),
  metric("bms/temperature", {
    label: "BMS Battery Temperature",
    unit: "°C",
    group: "battery",
    type: "S_WORD",
    addr: 10008,
    scale: 0.1,
    // The doc gives 0.1 ℃ with no bias, unlike 586 (0.1 ℃, offset -100). Stated
    // explicitly rather than inherited: if this reads ~100 ℃ at room
    // temperature the register carries the same +100 bias and wants offset: -100.
    offset: 0,
    kind: "measurement",
    deadband: 0.5,
  }),
  // Pack-reported charge/discharge envelope — what the BMS is asking the
  // inverter for right now, which is why it is worth having beside the
  // inverter's own limits (108/109) when charging stalls. `config`: these are
  // declared limits that move when the pack is reconfigured, not a signal that
  // needs a row per poll, so a change-log keeps the whole history for a
  // fraction of the writes. Same for SoH above, which moves in 1 % steps over
  // months.
  metric("bms/charge_voltage", {
    label: "BMS Charge Voltage",
    unit: "V",
    group: "battery",
    addr: 10009,
    scale: 0.1,
    kind: "measurement",
    storage: "config",
  }),
  metric("bms/discharge_voltage", {
    label: "BMS Discharge Voltage",
    unit: "V",
    group: "battery",
    addr: 10010,
    scale: 0.1,
    kind: "measurement",
    storage: "config",
  }),
  metric("bms/charge_end_voltage", {
    label: "BMS Charge Cut-off Voltage",
    unit: "V",
    group: "battery",
    addr: 10011,
    kind: "measurement",
    storage: "config",
  }),
  metric("bms/discharge_end_voltage", {
    label: "BMS Discharge Cut-off Voltage",
    unit: "V",
    group: "battery",
    addr: 10012,
    kind: "measurement",
    storage: "config",
  }),
  metric("bms/charge_limit_current", {
    label: "BMS Charge Current Limit",
    unit: "A",
    group: "battery",
    addr: 10013,
    kind: "measurement",
    storage: "config",
  }),
  metric("bms/discharge_limit_current", {
    label: "BMS Discharge Current Limit",
    unit: "A",
    group: "battery",
    addr: 10014,
    kind: "measurement",
    storage: "config",
  }),
  metric("bms/off_grid_charge_limit_current", {
    label: "BMS Off-grid Charge Current Limit",
    unit: "A",
    group: "battery",
    addr: 10015,
    kind: "measurement",
    storage: "config",
  }),
  metric("bms/off_grid_discharge_limit_current", {
    label: "BMS Off-grid Discharge Current Limit",
    unit: "A",
    group: "battery",
    addr: 10016,
    kind: "measurement",
    storage: "config",
  }),
  metric("bms/force_charge_flag", {
    label: "BMS Force Charge Flag",
    group: "battery",
    addr: 10017,
    kind: "status",
    storage: "config",
  }),
  metric("bms/check_soc_flag", {
    label: "BMS SoC Calibration Flag",
    group: "battery",
    addr: 10018,
    kind: "status",
    storage: "config",
  }),
  // Pack fault / alarm bitmasks — one bit per condition, so no enumLabels and
  // no deadband; `config` keeps a change-log rather than a row per poll.
  metric("bms/fault/1", {
    label: "BMS Fault Word 1",
    group: "battery",
    addr: 10019,
    kind: "status",
    storage: "config",
  }),
  metric("bms/fault/2", {
    label: "BMS Fault Word 2",
    group: "battery",
    addr: 10020,
    kind: "status",
    storage: "config",
  }),
  metric("bms/alarm/1", {
    label: "BMS Alarm Word 1",
    group: "battery",
    addr: 10021,
    kind: "status",
    storage: "config",
  }),
  metric("bms/alarm/2", {
    label: "BMS Alarm Word 2",
    group: "battery",
    addr: 10022,
    kind: "status",
    storage: "config",
  }),
];
