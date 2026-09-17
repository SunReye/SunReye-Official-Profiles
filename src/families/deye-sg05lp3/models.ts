import type { ModelOverrides } from "@sunreye/profile-sdk";
import type { DeyeKey } from "./keys";

/**
 * SG05LP3-EU-SM2 three-phase hybrid SKUs, keyed by profile id. They share the
 * whole register map and differ only in the battery charge/discharge
 * current ceiling (equal per model), from the vendor datasheets. Typed against
 * {@link DeyeKey} so the overlay keys autocomplete and a typo won't compile.
 *
 * Both datasheets give every SKU 2 MPP trackers, but the string inputs differ:
 * the 14K+ SKUs have four, the 3-12K SKUs two. The base map carries all four and
 * the five smaller models drop PV3/PV4, so each profile reports only the inputs
 * its hardware has. `dc.total_power` is a `sumOf({ role: "pv.string.power" })`,
 * so every model re-derives the right total with no further patch.
 *
 *   Model  Charge/Discharge (A)  Rated AC in/out (W)
 *   5K     120                   5000
 *   6K     135                   6000
 *   8K     190                   8000
 *   10K    210                   10000
 *   12K    240                   12000
 *   14K    260                   14000
 *   15K    280                   15000
 *   16K    300                   16000
 *   18K    330                   18000
 *   20K    350                   20000
 *
 * Sources — the 3-12K and 14-20K datasheets are separate documents:
 *   https://www.deyeinverter.com/deyeinverter/2024/09/27/datasheet_sun-3-12k-sg05lp3-eu-sm2_240927_en.pdf
 *   https://www.deyeinverter.com/deyeinverter/2024/06/01/datasheet_sun-14-20k-sg05lp3-eu-sm2_240601_en.pdf
 *
 * The 3K (70 A) and 4K (95 A) SKUs are on the same datasheet and can be added
 * the same way if anyone asks for them.
 */
export const models: Record<string, ModelOverrides<DeyeKey>> = {
  "deye-sun5k-sg05lp3": {
    name: "SUN-5K-SG05LP3-EU-SM2",
    metrics: {
      "dc.pv3.*": null,
      "dc.pv4.*": null,
      "settings.battery.maximum_charge_current": { max: 120 },
      "settings.battery.maximum_discharge_current": { max: 120 },
    },
  },
  "deye-sun6k-sg05lp3": {
    name: "SUN-6K-SG05LP3-EU-SM2",
    metrics: {
      "dc.pv3.*": null,
      "dc.pv4.*": null,
      "settings.battery.maximum_charge_current": { max: 135 },
      "settings.battery.maximum_discharge_current": { max: 135 },
    },
  },
  "deye-sun8k-sg05lp3": {
    name: "SUN-8K-SG05LP3-EU-SM2",
    metrics: {
      "dc.pv3.*": null,
      "dc.pv4.*": null,
      "settings.battery.maximum_charge_current": { max: 190 },
      "settings.battery.maximum_discharge_current": { max: 190 },
    },
  },
  "deye-sun10k-sg05lp3": {
    name: "SUN-10K-SG05LP3-EU-SM2",
    metrics: {
      "dc.pv3.*": null,
      "dc.pv4.*": null,
      "settings.battery.maximum_charge_current": { max: 210 },
      "settings.battery.maximum_discharge_current": { max: 210 },
    },
  },
  "deye-sun12k-sg05lp3": {
    name: "SUN-12K-SG05LP3-EU-SM2",
    metrics: {
      "dc.pv3.*": null,
      "dc.pv4.*": null,
      "settings.battery.maximum_charge_current": { max: 240 },
      "settings.battery.maximum_discharge_current": { max: 240 },
    },
  },
  "deye-sun14k-sg05lp3": {
    name: "SUN-14K-SG05LP3-EU-SM2",
    metrics: {
      "settings.battery.maximum_charge_current": { max: 260 },
      "settings.battery.maximum_discharge_current": { max: 260 },
    },
  },
  "deye-sun15k-sg05lp3": {
    name: "SUN-15K-SG05LP3-EU-SM2",
    metrics: {
      "settings.battery.maximum_charge_current": { max: 280 },
      "settings.battery.maximum_discharge_current": { max: 280 },
    },
  },
  "deye-sun16k-sg05lp3": {
    name: "SUN-16K-SG05LP3-EU-SM2",
    metrics: {
      "settings.battery.maximum_charge_current": { max: 300 },
      "settings.battery.maximum_discharge_current": { max: 300 },
    },
  },
  "deye-sun18k-sg05lp3": {
    name: "SUN-18K-SG05LP3-EU-SM2",
    metrics: {
      "settings.battery.maximum_charge_current": { max: 330 },
      "settings.battery.maximum_discharge_current": { max: 330 },
    },
  },
  "deye-sun20k-sg05lp3": {
    name: "SUN-20K-SG05LP3-EU-SM2",
    metrics: {
      "settings.battery.maximum_charge_current": { max: 350 },
      "settings.battery.maximum_discharge_current": { max: 350 },
    },
  },
};
