import { metric } from "@sunreye/profile-sdk";

/** Inverter status, relays and temperatures. */
export const inverter = [
  metric("inverter/status", {
    label: "Running status",
    group: "inverter",
    addr: 500,
    role: "inverter.status",
    kind: "status",
    enumLabels: { 0: "Standby", 1: "Self-check", 2: "Normal", 3: "Alarm", 4: "Fault" },
  }),
  metric("ac/relay_status", {
    label: "AC relays status",
    group: "inverter",
    addr: 552,
    role: "inverter.relay_status",
    kind: "status",
    enumLabels: { 0: "Open", 1: "Closed" },
  }),
  metric("radiator_temp", {
    label: "DC Temperature",
    unit: "°C",
    group: "inverter",
    type: "S_WORD",
    addr: 540,
    scale: 0.1,
    offset: -100,
    role: "inverter.temperature.dc",
    deadband: 0.5,
  }),
  metric("ac/temperature", {
    label: "AC Temperature",
    unit: "°C",
    group: "inverter",
    type: "S_WORD",
    addr: 541,
    scale: 0.1,
    offset: -100,
    role: "inverter.temperature.ac",
    deadband: 0.5,
  }),
  // Warning (553/554) and fault (555-558) bitmasks, doc v105.4. Each bit is a
  // separate condition, so these are bitfields rather than enums — no
  // enumLabels, and no deadband (it could swallow a transition). `config`
  // keeps a change-log instead of a row per poll: a fault word is interesting
  // when it changes, and is flat zero the rest of the time.
  metric("inverter/warning/1", {
    label: "Warning Word 1",
    group: "inverter",
    addr: 553,
    kind: "status",
    storage: "config",
  }),
  metric("inverter/warning/2", {
    label: "Warning Word 2",
    group: "inverter",
    addr: 554,
    kind: "status",
    storage: "config",
  }),
  metric("inverter/fault/1", {
    label: "Fault Word 1",
    group: "inverter",
    addr: 555,
    kind: "status",
    storage: "config",
  }),
  metric("inverter/fault/2", {
    label: "Fault Word 2",
    group: "inverter",
    addr: 556,
    kind: "status",
    storage: "config",
  }),
  metric("inverter/fault/3", {
    label: "Fault Word 3",
    group: "inverter",
    addr: 557,
    kind: "status",
    storage: "config",
  }),
  metric("inverter/fault/4", {
    label: "Fault Word 4",
    group: "inverter",
    addr: 558,
    kind: "status",
    storage: "config",
  }),
];
