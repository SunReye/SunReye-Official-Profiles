import { control } from "@sunreye/profile-sdk";
import type { MetricDataDef } from "@sunreye/profile-sdk";
import type { DeyeKey } from "./keys";

/**
 * Composite controls — no registers of their own. Battery discharge
 * lock: on, snapshot the max-discharge-current limit and force it to 0; off,
 * restore the captured limit. `control<DeyeKey>` autocompletes + compile-checks
 * the `target`.
 */
export const controls: MetricDataDef[] = [
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
