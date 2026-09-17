import { metric } from "@sunreye/profile-sdk";

/** Writable settings. */
export const settings = [
  metric("settings/battery/maximum_charge_current", {
    label: "Max battery charge current",
    unit: "A",
    group: "settings",
    addr: 108,
    access: "rw",
    role: "setting.battery.max_charge_current",
    // Generic family envelope (largest SKU); individual SKUs tighten it in `models`.
    range: { min: 0, max: 350 },
    storage: "series",
  }),
  metric("settings/battery/maximum_discharge_current", {
    label: "Max battery discharge current",
    unit: "A",
    group: "settings",
    addr: 109,
    access: "rw",
    role: "setting.battery.max_discharge_current",
    range: { min: 0, max: 350 },
    storage: "series",
  }),
  metric("settings/battery/maximum_grid_charge_current", {
    label: "Max battery grid-charge current",
    unit: "A",
    group: "settings",
    addr: 128,
    access: "rw",
    role: "setting.battery.max_grid_charge_current",
    storage: "series",
  }),
  metric("settings/battery/grid_charge", {
    label: "Grid Charge enabled",
    group: "settings",
    addr: 130,
    access: "rw",
    role: "setting.battery.grid_charge",
    enumLabels: { 0: "Off", 1: "On" },
  }),
  metric("settings/workmode", {
    label: "Work Mode",
    group: "settings",
    addr: 142,
    access: "rw",
    role: "setting.work_mode",
    enumLabels: { 0: "Selling First", 1: "Zero Export to Load", 2: "Zero Export to CT" },
  }),
  metric("settings/solar_sell_max_power", {
    label: "Max Solar Sell Power",
    unit: "W",
    group: "settings",
    addr: 143,
    access: "rw",
    role: "setting.solar_sell.max_power",
    storage: "series",
  }),
  metric("settings/solar_sell", {
    label: "Solar sell enabled",
    group: "settings",
    addr: 145,
    access: "rw",
    role: "setting.solar_sell.enabled",
    enumLabels: { 0: "Off", 1: "On" },
  }),
  // ---- Battery capacity and SoC thresholds (doc v105.4) ----
  // The voltage-writing counterparts of these registers (99-101 charge curve,
  // 118-120 shutdown/restart/low points) and the grid protection trip points
  // (185-188) are deliberately NOT mapped: a wrong write there is a pack or a
  // grid-compliance problem, not a UI annoyance. Read them off the inverter's
  // own display.
  //
  // 107 (TEMPCO) and 114 (charge efficiency) are out for the same reason plus a
  // second one: both are lead-acid-era knobs. TEMPCO shifts the charge voltage
  // with pack temperature, which only means anything inside the four-stage
  // curve above, and charge efficiency calibrates a coulomb-counted SoC. On the
  // reference unit (10.20.0.62) register 98 reads 1 — lithium, SoC from the BMS
  // — so neither is in any active path, and TEMPCO is a charge-curve write we
  // would be shipping for nothing.
  metric("settings/battery/capacity", {
    label: "Battery Capacity",
    unit: "Ah",
    group: "settings",
    addr: 102,
    access: "rw",
    kind: "setting",
    range: { min: 0, max: 2000 },
  }),
  metric("settings/battery/shutdown_soc", {
    label: "Battery Shutdown SoC",
    unit: "%",
    group: "settings",
    addr: 115,
    access: "rw",
    kind: "setting",
    range: { min: 0, max: 100 },
  }),
  metric("settings/battery/restart_soc", {
    label: "Battery Restart SoC",
    unit: "%",
    group: "settings",
    addr: 116,
    access: "rw",
    kind: "setting",
    range: { min: 0, max: 100 },
  }),
  metric("settings/battery/low_soc", {
    label: "Battery Low SoC Warning",
    unit: "%",
    group: "settings",
    addr: 117,
    access: "rw",
    kind: "setting",
    range: { min: 0, max: 100 },
  }),

  // ---- Generator / grid charge start points (doc v105.4) ----
  // SoC start points only; the voltage start points (123/126) are left out with
  // the rest of the voltage writes. The doc prints [0000 6300] for these two as
  // well, which is the voltage row's range copied down a cell; a start-charging
  // SoC is a percentage, so they carry 0-100. The charge *current* (125) is left
  // unranged: the doc's [0,185] is the ceiling of the SKU it documents, not of
  // this family, exactly like the grid-charge current above.
  metric("settings/battery/generator_charge_start_soc", {
    label: "Generator Charge Start SoC",
    unit: "%",
    group: "settings",
    addr: 124,
    access: "rw",
    kind: "setting",
    range: { min: 0, max: 100 },
  }),
  metric("settings/battery/generator_charge_current", {
    label: "Generator Charge Current",
    unit: "A",
    group: "settings",
    addr: 125,
    access: "rw",
    kind: "setting",
    storage: "series",
  }),
  metric("settings/battery/grid_charge_start_soc", {
    label: "Grid Charge Start SoC",
    unit: "%",
    group: "settings",
    addr: 127,
    access: "rw",
    kind: "setting",
    range: { min: 0, max: 100 },
  }),
  metric("settings/battery/generator_charge", {
    label: "Generator Charge enabled",
    group: "settings",
    addr: 129,
    access: "rw",
    kind: "setting",
    enumLabels: { 0: "Off", 1: "On" },
  }),

  // ---- Grid protection trip points (doc v105.4) ----
  // Raw ranges [1800,2700] at 0.1 V and [4500,6500] at 0.01 Hz. These are
  // grid-code limits, not model ratings, so they carry the doc's range as-is.
];
