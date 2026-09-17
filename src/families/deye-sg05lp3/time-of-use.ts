import { metric } from "@sunreye/profile-sdk";
import type { MetricDataDef } from "@sunreye/profile-sdk";

/** Time-of-use schedule (writable). */
export const timeOfUse: MetricDataDef[] = [
  metric("timeofuse/selling", {
    label: "TOU Weekly Selling Schedule",
    group: "timeofuse",
    addr: 146,
    access: "rw",
  }),
  ...[148, 149, 150, 151, 152, 153].map((addr, i) =>
    metric(`timeofuse/time/${i + 1}`, {
      label: `TOU Time ${i + 1}`,
      group: "timeofuse",
      addr,
      access: "rw",
    }),
  ),
  ...[154, 155, 156, 157, 158, 159].map((addr, i) =>
    metric(`timeofuse/power/${i + 1}`, {
      label: `TOU Power ${i + 1}`,
      unit: "W",
      group: "timeofuse",
      addr,
      access: "rw",
      // Grid charge/discharge power setpoint. Generic family envelope (largest
      // SKU, 20 kW); without a range HA defaults the number entity to 0–100 and
      // rejects real setpoints (e.g. 6000 W).
      range: { min: 0, max: 20000 },
    }),
  ),
  ...[160, 161, 162, 163, 164, 165].map((addr, i) =>
    metric(`timeofuse/voltage/${i + 1}`, {
      label: `TOU Voltage ${i + 1}`,
      unit: "V",
      group: "timeofuse",
      addr,
      scale: 0.01,
      access: "rw",
    }),
  ),
  ...[166, 167, 168, 169, 170, 171].map((addr, i) =>
    metric(`timeofuse/soc/${i + 1}`, {
      label: `TOU SOC ${i + 1}`,
      unit: "%",
      group: "timeofuse",
      addr,
      access: "rw",
      // A percentage with no bounds cannot clamp a write or scale a gauge.
      range: { min: 0, max: 100 },
    }),
  ),
  ...[172, 173, 174, 175, 176, 177].map((addr, i) =>
    metric(`timeofuse/enabled/${i + 1}`, {
      label: `TOU Charge Enable ${i + 1}`,
      group: "timeofuse",
      addr,
      access: "rw",
    }),
  ),
];
