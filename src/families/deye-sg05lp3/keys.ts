import { battery } from "./battery";
import { bms } from "./bms";
import { derived } from "./derived";
import { generator } from "./generator";
import { grid } from "./grid";
import { inverter } from "./inverter";
import { load } from "./load";
import { settings } from "./settings";
import { solar } from "./solar";
import { system } from "./system";

/**
 * Union of every statically-keyed register key, e.g.
 * `"settings.battery.maximum_discharge_current"`. Each `metric()` returns a
 * literal `key` type (see `TopicToKey`), so this is the exact set of real keys —
 * what gives composite-control `target`s IDE autocomplete and compile checks.
 * The time-of-use table (./time-of-use) is excluded on purpose: it builds keys from dynamic
 * template literals (`timeofuse/time/${i}`), so its key type is `string` and
 * would collapse the union.
 */
export type DeyeKey =
  | (typeof inverter)[number]["key"]
  | (typeof solar)[number]["key"]
  | (typeof grid)[number]["key"]
  | (typeof derived)[number]["key"]
  | (typeof battery)[number]["key"]
  | (typeof bms)[number]["key"]
  | (typeof generator)[number]["key"]
  | (typeof settings)[number]["key"]
  | (typeof system)[number]["key"]
  | (typeof load)[number]["key"];
