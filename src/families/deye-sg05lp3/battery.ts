import { metric } from "@sunreye/profile-sdk";
import { CHARGE_FLOW } from "./conventions";

/** Battery pack. */
export const battery = [
  metric("battery/daily_charge", {
    label: "Daily Battery Charge",
    unit: "kWh",
    group: "battery",
    addr: 514,
    scale: 0.1,
    role: "battery.energy.charged.today",
  }),
  metric("battery/daily_discharge", {
    label: "Daily Battery Discharge",
    unit: "kWh",
    group: "battery",
    addr: 515,
    scale: 0.1,
    role: "battery.energy.discharged.today",
  }),
  metric("battery/total_charge", {
    label: "Total Battery Charge",
    unit: "kWh",
    group: "battery",
    type: "U_DWORD",
    addr: [516, 517],
    scale: 0.1,
    role: "battery.energy.charged.total",
  }),
  metric("battery/total_discharge", {
    label: "Total Battery Discharge",
    unit: "kWh",
    group: "battery",
    type: "U_DWORD",
    addr: [518, 519],
    scale: 0.1,
    role: "battery.energy.discharged.total",
  }),
  // Aggregate pack power across both BMS banks — verified to read the full pack
  // (~745 W = battery.voltage × total current), not a single bank's share. So it
  // stays the canonical total; only current is reported per-bank (see below).
  metric("battery/power", {
    label: "Battery Power",
    unit: "W",
    group: "battery",
    type: "S_WORD",
    addr: 590,
    role: "battery.power",
    flow: CHARGE_FLOW,
    deadband: 20,
  }),
  metric("battery/voltage", {
    label: "Battery Voltage",
    unit: "V",
    group: "battery",
    addr: 587,
    scale: 0.01,
    role: "battery.voltage",
    deadband: 0.1,
  }),
  metric("battery/soc", {
    label: "Battery SOC",
    unit: "%",
    group: "battery",
    addr: 588,
    role: "battery.soc",
    range: { min: 0, max: 100 },
  }),
  // Dual-BMS pack: current is sensed per bank (591 / 594) while power (590) is
  // already the aggregate. Each bank register reads ~half the true current, so
  // the canonical Battery Current sums them (verified: 7.73 + 8.13 = 15.86 A,
  // matching 829 W ÷ voltage). Sign flows from each bank (CHARGE_FLOW: +
  // discharging). Only current is split out — the bank-2 voltage/SOC/power/temp
  // registers (589/593/595/596) read 0 on this model, so voltage, SOC, power and
  // temperature stay pack-level (the canonical metrics above).
  metric("battery/1/current", {
    label: "Battery 1 Current",
    unit: "A",
    group: "battery",
    type: "S_WORD",
    addr: 591,
    scale: 0.01,
    flow: CHARGE_FLOW,
    kind: "measurement",
    deadband: 0.2,
  }),
  metric("battery/2/current", {
    label: "Battery 2 Current",
    unit: "A",
    group: "battery",
    type: "S_WORD",
    addr: 594,
    scale: 0.01,
    flow: CHARGE_FLOW,
    kind: "measurement",
    deadband: 0.2,
  }),
  metric("battery/current", {
    label: "Battery Current",
    unit: "A",
    group: "battery",
    role: "battery.current",
    flow: CHARGE_FLOW,
    computeExpr: { sum: ["battery.1.current", "battery.2.current"] },
  }),
  metric("battery/temperature", {
    label: "Battery Temperature",
    unit: "°C",
    group: "battery",
    addr: 586,
    scale: 0.1,
    offset: -100,
    role: "battery.temperature",
    deadband: 0.5,
  }),
  // Battery Charging Type Control Mode (read-only for now). Decides whether the
  // time-of-use schedule is honored via target voltage (lead-acid, four-stage)
  // or target SOC (lithium BMS), so the TOU editor shows only the matching field.
  metric("battery/mode", {
    label: "Battery Mode",
    group: "battery",
    addr: 98,
    role: "battery.mode",
    kind: "status",
    enumLabels: { 0: "Lead-acid (voltage)", 1: "Lithium (SOC)" },
  }),
  // Second battery pack (doc v105.4: 589 SOC, 593 voltage, 595 power). Reads
  // zero on single-pack installs. Scales are the low-voltage column, matching
  // pack 1 above. 596 (pack 2 temperature) is left out: the doc gives it no
  // unit or scale, and a guessed one ships a wrong temperature.
  metric("battery/2/soc", {
    label: "Battery 2 SoC",
    kind: "measurement",
    unit: "%",
    group: "battery",
    addr: 589,
    range: { min: 0, max: 100 },
  }),
  metric("battery/2/voltage", {
    label: "Battery 2 Voltage",
    kind: "measurement",
    unit: "V",
    group: "battery",
    addr: 593,
    scale: 0.01,
    deadband: 0.1,
  }),
  metric("battery/2/power", {
    label: "Battery 2 Power",
    kind: "measurement",
    unit: "W",
    group: "battery",
    type: "S_WORD",
    addr: 595,
    flow: CHARGE_FLOW,
    deadband: 20,
  }),
];
