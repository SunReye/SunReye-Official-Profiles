import { metric } from "@sunreye/profile-sdk";

/** System. Packed date/time across three registers (opaque). */
export const system = [
  metric("settings/system_time", {
    label: "System time",
    group: "system",
    type: "RAW",
    addr: [62, 63, 64],
    kind: "status",
    storage: "none",
  }),
];
