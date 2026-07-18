import {
  control,
  defineFamily,
  metric,
  sumOf,
  type MetricDataDef,
} from "@sunreye/profile-sdk";

// Deye SG01HP3 — three-phase high-voltage hybrid inverter family
// (SUN-5/6/8/10/12/15/20/25K-SG01HP3-EU-AM2). One shared register map, one
// profile per SKU. Register addresses, scales, units and signedness are
// transcribed from the deye-inverter-mqtt reference map:
//   https://github.com/kbialek/deye-inverter-mqtt/blob/main/src/deye_sensors_deye_sg01hp3.py
//
// Encoding notes carried over from the reference:
//   - SingleRegisterSensor(signed=False) -> U_WORD, (signed=True) -> S_WORD.
//   - DoubleRegisterSensor -> U_DWORD, addresses [low, high] = [addr, addr+1].
//   - Temperatures use scale 0.1 with offset -100 (raw*0.1 - 100 = °C).
//   - Battery/grid sign conventions (flow labels) follow the common Deye MQTT
//     dashboards; verify against your unit if a direction looks inverted.

// Direction labels for signed metrics, shared across the register map.
const CHARGE_FLOW = { positive: "Discharging", negative: "Charging" } as const;
const GRID_FLOW = { positive: "Importing", negative: "Exporting" } as const;

// The shared register map. Named (rather than inlined into defineFamily) so we
// can derive the profile's canonical key union — DeyeKey — for the
// compile-checked composite control below.
const metrics = [
    // ---- Solar / PV (4 MPPT inputs, regs 672-683) ----
    metric("dc/pv1/power", {
      label: "PV1 Power",
      group: "solar",
      role: "pv.string.power",
      index: 1,
      addr: 672,
      scale: 10,
      unit: "W",
    }),
    metric("dc/pv2/power", {
      label: "PV2 Power",
      group: "solar",
      role: "pv.string.power",
      index: 2,
      addr: 673,
      scale: 10,
      unit: "W",
    }),
    metric("dc/pv3/power", {
      label: "PV3 Power",
      group: "solar",
      role: "pv.string.power",
      index: 3,
      addr: 674,
      scale: 10,
      unit: "W",
    }),
    metric("dc/pv4/power", {
      label: "PV4 Power",
      group: "solar",
      role: "pv.string.power",
      index: 4,
      addr: 675,
      scale: 10,
      unit: "W",
    }),
    metric("dc/pv1/voltage", {
      label: "PV1 Voltage",
      group: "solar",
      role: "pv.string.voltage",
      index: 1,
      addr: 676,
      scale: 0.1,
      unit: "V",
    }),
    metric("dc/pv2/voltage", {
      label: "PV2 Voltage",
      group: "solar",
      role: "pv.string.voltage",
      index: 2,
      addr: 678,
      scale: 0.1,
      unit: "V",
    }),
    metric("dc/pv3/voltage", {
      label: "PV3 Voltage",
      group: "solar",
      role: "pv.string.voltage",
      index: 3,
      addr: 680,
      scale: 0.1,
      unit: "V",
    }),
    metric("dc/pv4/voltage", {
      label: "PV4 Voltage",
      group: "solar",
      role: "pv.string.voltage",
      index: 4,
      addr: 682,
      scale: 0.1,
      unit: "V",
    }),
    metric("dc/pv1/current", {
      label: "PV1 Current",
      group: "solar",
      role: "pv.string.current",
      index: 1,
      addr: 677,
      scale: 0.1,
      unit: "A",
    }),
    metric("dc/pv2/current", {
      label: "PV2 Current",
      group: "solar",
      role: "pv.string.current",
      index: 2,
      addr: 679,
      scale: 0.1,
      unit: "A",
    }),
    metric("dc/pv3/current", {
      label: "PV3 Current",
      group: "solar",
      role: "pv.string.current",
      index: 3,
      addr: 681,
      scale: 0.1,
      unit: "A",
    }),
    metric("dc/pv4/current", {
      label: "PV4 Current",
      group: "solar",
      role: "pv.string.current",
      index: 4,
      addr: 683,
      scale: 0.1,
      unit: "A",
    }),
    // Derived total PV power. sumOf declares the intent ("every PV-string power")
    // once and resolves it per profile at build time, so models that drop a
    // string re-derive the correct total with no overlay patch.
    metric("dc/total_power", {
      label: "PV Total Power",
      group: "solar",
      role: "pv.total.power",
      unit: "W",
      computeExpr: sumOf({ role: "pv.string.power" }),
    }),
    metric("day_energy", {
      label: "Daily Production",
      group: "solar",
      role: "production.today",
      addr: 529,
      scale: 0.1,
      unit: "kWh",
    }),
    metric("total_energy", {
      label: "Total Production",
      group: "solar",
      role: "production.total",
      type: "U_DWORD",
      addr: [534, 535],
      scale: 0.1,
      unit: "kWh",
    }),

    // ---- Battery (primary pack, regs 514-518 & 586-591) ----
    metric("battery/soc", {
      label: "Battery SoC",
      group: "battery",
      role: "battery.soc",
      addr: 588,
      unit: "%",
    }),
    metric("battery/power", {
      label: "Battery Power",
      group: "battery",
      role: "battery.power",
      type: "S_WORD",
      addr: 590,
      scale: 10,
      unit: "W",
      flow: CHARGE_FLOW,
    }),
    metric("battery/voltage", {
      label: "Battery Voltage",
      group: "battery",
      role: "battery.voltage",
      addr: 587,
      scale: 0.1,
      unit: "V",
    }),
    metric("battery/current", {
      label: "Battery Current",
      group: "battery",
      role: "battery.current",
      type: "S_WORD",
      addr: 591,
      scale: 0.01,
      unit: "A",
      flow: CHARGE_FLOW,
    }),
    metric("battery/temperature", {
      label: "Battery Temperature",
      group: "battery",
      role: "battery.temperature",
      addr: 586,
      scale: 0.1,
      offset: -100,
      unit: "°C",
    }),
    metric("battery/daily_charge", {
      label: "Daily Battery Charge",
      group: "battery",
      role: "battery.energy.charged.today",
      addr: 514,
      scale: 0.1,
      unit: "kWh",
    }),
    metric("battery/daily_discharge", {
      label: "Daily Battery Discharge",
      group: "battery",
      role: "battery.energy.discharged.today",
      addr: 515,
      scale: 0.1,
      unit: "kWh",
    }),
    metric("battery/total_charge", {
      label: "Total Battery Charge",
      group: "battery",
      role: "battery.energy.charged.total",
      type: "U_DWORD",
      addr: [516, 517],
      scale: 0.1,
      unit: "kWh",
    }),
    metric("battery/total_discharge", {
      label: "Total Battery Discharge",
      group: "battery",
      role: "battery.energy.discharged.total",
      type: "U_DWORD",
      addr: [518, 519],
      scale: 0.1,
      unit: "kWh",
    }),

    // ---- Grid (three-phase, regs 598-635) ----
    metric("ac/total_power", {
      label: "Total Grid Power",
      group: "grid",
      role: "grid.power",
      type: "S_WORD",
      addr: 625,
      unit: "W",
      flow: GRID_FLOW,
    }),
    metric("ac/l1/voltage", {
      label: "Grid Voltage L1",
      group: "grid",
      role: "grid.phase.voltage",
      index: 1,
      addr: 598,
      scale: 0.1,
      unit: "V",
    }),
    metric("ac/l2/voltage", {
      label: "Grid Voltage L2",
      group: "grid",
      role: "grid.phase.voltage",
      index: 2,
      addr: 599,
      scale: 0.1,
      unit: "V",
    }),
    metric("ac/l3/voltage", {
      label: "Grid Voltage L3",
      group: "grid",
      role: "grid.phase.voltage",
      index: 3,
      addr: 600,
      scale: 0.1,
      unit: "V",
    }),
    metric("ac/l1/current", {
      label: "Grid Current L1",
      group: "grid",
      role: "grid.phase.current",
      index: 1,
      type: "S_WORD",
      addr: 630,
      scale: 0.01,
      unit: "A",
      flow: GRID_FLOW,
    }),
    metric("ac/l2/current", {
      label: "Grid Current L2",
      group: "grid",
      role: "grid.phase.current",
      index: 2,
      type: "S_WORD",
      addr: 631,
      scale: 0.01,
      unit: "A",
      flow: GRID_FLOW,
    }),
    metric("ac/l3/current", {
      label: "Grid Current L3",
      group: "grid",
      role: "grid.phase.current",
      index: 3,
      type: "S_WORD",
      addr: 632,
      scale: 0.01,
      unit: "A",
      flow: GRID_FLOW,
    }),
    metric("ac/l1/power", {
      label: "Grid Power L1",
      group: "grid",
      role: "grid.phase.power",
      index: 1,
      type: "S_WORD",
      addr: 633,
      unit: "W",
      flow: GRID_FLOW,
    }),
    metric("ac/l2/power", {
      label: "Grid Power L2",
      group: "grid",
      role: "grid.phase.power",
      index: 2,
      type: "S_WORD",
      addr: 634,
      unit: "W",
      flow: GRID_FLOW,
    }),
    metric("ac/l3/power", {
      label: "Grid Power L3",
      group: "grid",
      role: "grid.phase.power",
      index: 3,
      type: "S_WORD",
      addr: 635,
      unit: "W",
      flow: GRID_FLOW,
    }),
    metric("ac/daily_energy_bought", {
      label: "Daily Energy Bought",
      group: "grid",
      role: "grid.energy.imported.today",
      addr: 520,
      scale: 0.1,
      unit: "kWh",
    }),
    metric("ac/total_energy_bought", {
      label: "Total Energy Bought",
      group: "grid",
      role: "grid.energy.imported.total",
      type: "U_DWORD",
      addr: [522, 523],
      scale: 0.1,
      unit: "kWh",
    }),
    metric("ac/daily_energy_sold", {
      label: "Daily Energy Sold",
      group: "grid",
      role: "grid.energy.exported.today",
      addr: 521,
      scale: 0.1,
      unit: "kWh",
    }),
    metric("ac/total_energy_sold", {
      label: "Total Energy Sold",
      group: "grid",
      role: "grid.energy.exported.total",
      type: "U_DWORD",
      addr: [524, 525],
      scale: 0.1,
      unit: "kWh",
    }),

    // ---- Backup / UPS load (regs 526-527 & 644-653) ----
    metric("ac/ups/total_power", {
      label: "Total Load Power",
      group: "load",
      role: "load.power",
      addr: 653,
      unit: "W",
    }),
    metric("ac/ups/l1/power", {
      label: "Load Power L1",
      group: "load",
      role: "load.phase.power",
      index: 1,
      type: "S_WORD",
      addr: 650,
      unit: "W",
    }),
    metric("ac/ups/l2/power", {
      label: "Load Power L2",
      group: "load",
      role: "load.phase.power",
      index: 2,
      type: "S_WORD",
      addr: 651,
      unit: "W",
    }),
    metric("ac/ups/l3/power", {
      label: "Load Power L3",
      group: "load",
      role: "load.phase.power",
      index: 3,
      type: "S_WORD",
      addr: 652,
      unit: "W",
    }),
    metric("ac/ups/l1/voltage", {
      label: "Load Voltage L1",
      group: "load",
      role: "load.phase.voltage",
      index: 1,
      addr: 644,
      scale: 0.1,
      unit: "V",
    }),
    metric("ac/ups/l2/voltage", {
      label: "Load Voltage L2",
      group: "load",
      role: "load.phase.voltage",
      index: 2,
      addr: 645,
      scale: 0.1,
      unit: "V",
    }),
    metric("ac/ups/l3/voltage", {
      label: "Load Voltage L3",
      group: "load",
      role: "load.phase.voltage",
      index: 3,
      addr: 646,
      scale: 0.1,
      unit: "V",
    }),
    metric("ac/ups/daily_energy", {
      label: "Daily Load Consumption",
      group: "load",
      role: "load.energy.today",
      addr: 526,
      scale: 0.1,
      unit: "kWh",
    }),
    metric("ac/ups/total_energy", {
      label: "Total Load Consumption",
      group: "load",
      role: "load.energy.total",
      type: "U_DWORD",
      addr: [527, 528],
      scale: 0.1,
      unit: "kWh",
    }),

    // ---- Generator port (regs 536 & 661-667) ----
    metric("ac/generator/total_power", {
      label: "Total Generator Power",
      group: "generator",
      role: "generator.power",
      type: "S_WORD",
      addr: 667,
      unit: "W",
    }),
    metric("ac/generator/l1/power", {
      label: "Generator Power L1",
      group: "generator",
      role: "generator.phase.power",
      index: 1,
      type: "S_WORD",
      addr: 664,
      unit: "W",
    }),
    metric("ac/generator/l2/power", {
      label: "Generator Power L2",
      group: "generator",
      role: "generator.phase.power",
      index: 2,
      type: "S_WORD",
      addr: 665,
      unit: "W",
    }),
    metric("ac/generator/l3/power", {
      label: "Generator Power L3",
      group: "generator",
      role: "generator.phase.power",
      index: 3,
      type: "S_WORD",
      addr: 666,
      unit: "W",
    }),
    metric("ac/generator/l1/voltage", {
      label: "Generator Voltage L1",
      group: "generator",
      role: "generator.phase.voltage",
      index: 1,
      addr: 661,
      scale: 0.1,
      unit: "V",
    }),
    metric("ac/generator/l2/voltage", {
      label: "Generator Voltage L2",
      group: "generator",
      role: "generator.phase.voltage",
      index: 2,
      addr: 662,
      scale: 0.1,
      unit: "V",
    }),
    metric("ac/generator/l3/voltage", {
      label: "Generator Voltage L3",
      group: "generator",
      role: "generator.phase.voltage",
      index: 3,
      addr: 663,
      scale: 0.1,
      unit: "V",
    }),
    metric("ac/generator/daily_energy", {
      label: "Daily Generator Production",
      group: "generator",
      role: "generator.energy.today",
      addr: 536,
      scale: 0.1,
      unit: "kWh",
    }),

    // ---- Inverter status & temperatures (regs 500, 540-541) ----
    metric("inverter/status", {
      label: "Running Status",
      group: "inverter",
      role: "inverter.status",
      addr: 500,
      unit: null,
      enumLabels: {
        0: "Standby",
        1: "Self-check",
        2: "Normal",
        3: "Alarm",
        4: "Fault",
      },
    }),
    metric("radiator_temp", {
      label: "DC (Radiator) Temperature",
      group: "inverter",
      role: "inverter.temperature.dc",
      type: "S_WORD",
      addr: 540,
      scale: 0.1,
      offset: -100,
      unit: "°C",
    }),
    metric("ac/temperature", {
      label: "AC (Inverter) Temperature",
      group: "inverter",
      role: "inverter.temperature.ac",
      type: "S_WORD",
      addr: 541,
      scale: 0.1,
      offset: -100,
      unit: "°C",
    }),

    // ---- Writable settings (regs 108-145) ----
    metric("settings/battery/maximum_charge_current", {
      label: "Max battery charge current",
      group: "settings",
      role: "setting.battery.max_charge_current",
      access: "rw",
      addr: 108,
      unit: "A",
      range: { min: 0, max: 50 }, // family ceiling; each model tightens below
    }),
    metric("settings/battery/maximum_discharge_current", {
      label: "Max battery discharge current",
      group: "settings",
      role: "setting.battery.max_discharge_current",
      access: "rw",
      addr: 109,
      unit: "A",
      range: { min: 0, max: 50 }, // family ceiling; each model tightens below
    }),
    metric("settings/battery/maximum_grid_charge_current", {
      label: "Max grid charge current",
      group: "settings",
      role: "setting.battery.max_grid_charge_current",
      access: "rw",
      addr: 128,
      unit: "A",
      range: { min: 0, max: 50 }, // bounded by the model's max charge current
    }),
    metric("settings/battery/grid_charge", {
      label: "Grid charge",
      group: "settings",
      role: "setting.battery.grid_charge",
      access: "rw",
      addr: 130,
      unit: null,
      enumLabels: { 0: "Disabled", 1: "Enabled" },
    }),
    metric("settings/workmode", {
      label: "Work mode",
      group: "settings",
      role: "setting.work_mode",
      access: "rw",
      addr: 142,
      unit: null,
      enumLabels: {
        0: "Selling first",
        1: "Zero export to load",
        2: "Zero export to CT",
      },
    }),
    metric("settings/solar_sell_max_power", {
      label: "Max solar sell power",
      group: "settings",
      role: "setting.solar_sell.max_power",
      access: "rw",
      addr: 143,
      scale: 10,
      unit: "W",
      range: { min: 0, max: 25000 }, // models tighten to their rated power below
    }),
    metric("settings/solar_sell", {
      label: "Solar sell",
      group: "settings",
      role: "setting.solar_sell.enabled",
      access: "rw",
      addr: 145,
      unit: null,
      enumLabels: { 0: "Disabled", 1: "Enabled" },
    }),
    // ---- Battery charge mode (reg 98) ----
    metric("battery/mode", {
      label: "Battery Mode",
      group: "battery",
      addr: 98,
      role: "battery.mode",
      kind: "status",
      enumLabels: { 0: "Lead-acid (voltage)", 1: "Lithium (SOC)" },
    }),

    // ---- Derived inverter figures (no registers of their own) ----
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
    }),
    metric("grid/export_power", {
      label: "Grid Export Power",
      unit: "W",
      group: "grid",
      computeExpr: { diff: ["grid.import_power", "ac.total_power"] },
    }),
    metric("battery/discharge_power", {
      label: "Battery Discharge Power",
      unit: "W",
      group: "battery",
      computeExpr: { clamp: { key: "battery.power", min: 0 } },
    }),
    metric("battery/charge_power", {
      label: "Battery Charge Power",
      unit: "W",
      group: "battery",
      computeExpr: { diff: ["battery.discharge_power", "battery.power"] },
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
    }),
  ];

// The profile's canonical key union (each metric's topic with "/" -> "."), used
// to compile-check composite-control targets against real keys.
type DeyeKey = (typeof metrics)[number]["key"];

// Composite controls — writable metrics with no register of their own. The
// battery discharge lock snapshots the max-discharge-current limit and forces it
// to 0 while engaged, restoring the captured value when released.
const controls: MetricDataDef[] = [
  control<DeyeKey>("settings/battery/lock", {
    label: "Battery discharge lock",
    group: "settings",
    enumLabels: { 0: "Unlocked", 1: "Locked" },
    controlExpr: {
      snapshotToggle: {
        target: "settings.battery.maximum_discharge_current",
        lockedValue: 0,
      },
    },
  }),
];

export const deyeSG01HP3 = defineFamily({
  id: "deye-sg01hp3",
  name: "SG01HP3",
  manufacturer: "Deye",
  version: "0.1.0",
  metrics: [...metrics, ...controls],
  // The SG01HP3-EU-AM2 lineup (2 MPP trackers, 160-700 V battery) shares this
  // register map; SKUs differ by rated power, PV string count, and the battery
  // charge/discharge current ceiling. Values from the official datasheet:
  //   https://www.deyeinverter.com/deyeinverter/2023/07/24/datasheet_sun-(5-25)k-sg01hp3-eu_230724_en.pdf
  //
  //   Model  Charge/Discharge (A)  Strings (1+1/2+1/2+2)  Rated AC out (W)
  //   5K     30                    2                      5000
  //   6K     30                    2                      6000
  //   8K     37                    2                      8000
  //   10K    37                    2                      10000
  //   12K    37                    3                      12000
  //   15K    37                    3                      15000
  //   20K    50                    4                      20000
  //   25K    50                    4                      25000
  //
  // Dropping PV strings drives capabilities.pvStrings (the base maps all 4);
  // the base total-PV metric uses sumOf({ role: "pv.string.power" }), so each
  // model re-derives the correct total from its surviving strings automatically.
  models: {
    "deye-sg01hp3-5k": {
      name: "SUN-5K-SG01HP3",
      metrics: {
        "dc.pv3.*": null,
        "dc.pv4.*": null,
        "settings.battery.maximum_charge_current": { max: 30 },
        "settings.battery.maximum_discharge_current": { max: 30 },
        "settings.battery.maximum_grid_charge_current": { max: 30 },        "settings.solar_sell_max_power": { max: 5000 },
      },
    },
    "deye-sg01hp3-6k": {
      name: "SUN-6K-SG01HP3",
      metrics: {
        "dc.pv3.*": null,
        "dc.pv4.*": null,
        "settings.battery.maximum_charge_current": { max: 30 },
        "settings.battery.maximum_discharge_current": { max: 30 },
        "settings.battery.maximum_grid_charge_current": { max: 30 },        "settings.solar_sell_max_power": { max: 6000 },
      },
    },
    "deye-sg01hp3-8k": {
      name: "SUN-8K-SG01HP3",
      metrics: {
        "dc.pv3.*": null,
        "dc.pv4.*": null,
        "settings.battery.maximum_charge_current": { max: 37 },
        "settings.battery.maximum_discharge_current": { max: 37 },
        "settings.battery.maximum_grid_charge_current": { max: 37 },        "settings.solar_sell_max_power": { max: 8000 },
      },
    },
    "deye-sg01hp3-10k": {
      name: "SUN-10K-SG01HP3",
      metrics: {
        "dc.pv3.*": null,
        "dc.pv4.*": null,
        "settings.battery.maximum_charge_current": { max: 37 },
        "settings.battery.maximum_discharge_current": { max: 37 },
        "settings.battery.maximum_grid_charge_current": { max: 37 },        "settings.solar_sell_max_power": { max: 10000 },
      },
    },
    "deye-sg01hp3-12k": {
      name: "SUN-12K-SG01HP3",
      metrics: {
        "dc.pv4.*": null,
        "settings.battery.maximum_charge_current": { max: 37 },
        "settings.battery.maximum_discharge_current": { max: 37 },
        "settings.battery.maximum_grid_charge_current": { max: 37 },        "settings.solar_sell_max_power": { max: 12000 },
      },
    },
    "deye-sg01hp3-15k": {
      name: "SUN-15K-SG01HP3",
      metrics: {
        "dc.pv4.*": null,
        "settings.battery.maximum_charge_current": { max: 37 },
        "settings.battery.maximum_discharge_current": { max: 37 },
        "settings.battery.maximum_grid_charge_current": { max: 37 },        "settings.solar_sell_max_power": { max: 15000 },
      },
    },
    "deye-sg01hp3-20k": {
      name: "SUN-20K-SG01HP3",
      metrics: {
        "settings.battery.maximum_charge_current": { max: 50 },
        "settings.battery.maximum_discharge_current": { max: 50 },
        "settings.battery.maximum_grid_charge_current": { max: 50 },
        "settings.solar_sell_max_power": { max: 20000 },
      },
    },
    "deye-sg01hp3-25k": {
      name: "SUN-25K-SG01HP3",
      metrics: {
        "settings.battery.maximum_charge_current": { max: 50 },
        "settings.battery.maximum_discharge_current": { max: 50 },
        "settings.battery.maximum_grid_charge_current": { max: 50 },
        "settings.solar_sell_max_power": { max: 25000 },
      },
    },
  },
});
