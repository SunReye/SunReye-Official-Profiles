# Authoring SunReye inverter profiles

This repository defines SunReye inverter profiles as typed code with
`@sunreye/profile-sdk` and builds them into an installable profile repo. When the user
asks to **create, add, extend, or debug a profile for their inverter** (Deye, Sunsynk,
Growatt, SMA, Victron, …), follow this guide.

You are helping someone describe their inverter to SunReye **as typed code** with
`@sunreye/profile-sdk`, then compile it to a validated, installable profile repo. A
profile is **pure data** — it can never execute code — and the SDK makes it *correct by
construction*: pick a role and the types force exactly the fields that role needs, or it
won't compile.

## Get these from the user first

1. **Make & model**, e.g. `Deye SUN-12K-SG04LP3`.
2. **The vendor Modbus/holding-register map** — a PDF/CSV of register address, name,
   unit, scale, and data type. This is the most important input; without it you are
   guessing. Ask for it. Vendors often publish one, and community maps exist for common
   brands.
3. **Which values matter** to them (solar, battery, grid, load, key settings) so you map
   the roles the UI renders before diagnostic extras.

**Never invent register addresses.** If an address is unknown, leave the metric out — a
wrong address ships a wrong number. Where the user has a live reading, sanity-check your
`scale`/`offset` against it.

## Workflow

1. (Optional) `bunx profile scaffold ./registers.csv --id <id> --name "<Name>" --manufacturer <M>`
   turns a register CSV into a starter `ProfileData` with roles left blank. Columns:
   `topic,label,unit,group,addr,type,scale,access` (order-independent; `topic` required;
   multi-register `addr` is `|`-separated).
2. Edit `src/profiles.ts`: one `metric(topic, opts)` per register, assigning a **role**
   wherever SunReye should render it.
3. Add **computed** metrics (totals, efficiency) with `computeExpr` / `sumOf`.
4. If the vendor ships several SKUs on one register map, author a `defineFamily` with a
   per-model overlay instead of copying the map.
5. Run `bun run build` (or `bunx profile validate` / `bunx profile coverage`) until it
   validates and covers the roles the user cares about.
6. Commit `index.json` + `profiles/*.json`, push to a public git repo, install from
   SunReye → Settings → Profiles.

## Defining a metric

```ts
import { defineProfile, metric, sumOf } from "@sunreye/profile-sdk";

metric("dc/pv1/power", {
  label: "PV1 Power", group: "solar", unit: "W",
  role: "pv.string.power", index: 1,   // indexed role → index required
  addr: 672,                            // holding-register address
});
```

`metric(topic, opts)` derives the entity `key` from the topic (`dc/pv1/power` →
`dc.pv1.power`) and defaults `type` (`U_WORD`), `scale` (`1`), `access` (`r`), `unit`
(`null`).

### Roles force their shape

The `role` is the inverter-agnostic concept the UI renders against. Choosing one narrows
the required fields:

- **indexed** role (`pv.string.power`, `grid.phase.power`, …) → `index` required (1-based).
- **enum/status** role (`inverter.status`, `setting.battery.grid_charge`, …) → `enumLabels`
  required (`{ 0: "Off", 1: "On" }`).
- **writable setting** role (`setting.*`) → `access: "rw"` required.

Omit any and it's a compile error. A metric with **no role** is allowed — a diagnostic
value that just isn't rendered by role. See the full catalog of role names and their
expected units in the concept doc (link below), or run `bunx profile coverage` to see
which roles you've mapped and which are missing.

### Registers & encoding gotchas

- `U_WORD`/`S_WORD` → one address; `U_DWORD` → `[low, high]`; `RAW` → N words.
- `scale` multiplies the raw value; `offset` is added **after** scaling
  (`raw * scale + offset`).
- Watch vendor encodings. Example: a temperature stored as °C×10 + 1000 decodes with
  `scale: 0.1, offset: -100` (raw 1250 → 25 °C).
- A value that flows both ways (battery charge/discharge, grid import/export) is usually
  `type: "S_WORD"` with a `flow: { positive: "Discharging", negative: "Charging" }` label.

## Computed metrics

Derived values use a small **closed** set — never arbitrary code — and carry no `addr`:

| Expression | Meaning |
| --- | --- |
| `{ sum: ["a", "b"] }` | add the listed keys |
| `{ diff: ["a", "b"] }` | `a − b` |
| `{ scale: ["a", k] }` | `a × k` |
| `{ combine: { add: [...], sub: [...] } }` | Σadd − Σsub (`sub` optional) |
| `{ ratio: { num: [...], den: [...], scale? } }` | (Σnum / Σden) × scale; zero den reads 0 |

A missing referenced key reads as `0`; a computed metric may only reference metrics defined
**earlier** in the list.

### Prefer `sumOf` for homogeneous totals

A hand-listed `sum` drifts the moment a model adds or drops a member. `sumOf` declares the
**intent** once and resolves it to a concrete `{ sum: [...] }` against the final metric set
at build time:

```ts
metric("dc/total_power", {
  label: "PV Total", group: "solar", unit: "W", role: "pv.total.power",
  computeExpr: sumOf({ role: "pv.string.power" }),   // every PV-string power
});
// also: sumOf({ keyPrefix: "battery.bank" })  — exact key + every `${prefix}.` child
```

Matching zero metrics is a **build error** (never a silent empty sum). In a family it
self-heals: a model that drops a string re-derives the correct total with no per-model
patch.

## Families (multi-SKU)

`defineFamily({ id, name, manufacturer, version, metrics, models })` shares one register
map and returns `[base, ...models]` — the generic base plus one self-contained profile per
SKU. Each `models[id].metrics` overlay is keyed by canonical metric key, one rule per
entry:

| Entry | Effect |
| --- | --- |
| `"key": { max: 280 }` (or any `metric()` field) | **patch** — merge fields; `min`/`max` set `range` |
| `"key": null` | **remove** that metric |
| `"prefix.*": null` | **remove** every metric under the prefix (a whole PV string) |
| `"new.key": { …full definition… }` | **add** a metric |

Keys autocomplete from the base map; a mistyped patch/remove target throws at build time.
**Removing a metric another one references is reconciled automatically:** a removed key in
a variadic compute list (`sum`, `combine.add`/`sub`, `ratio.num`/`den`) is pruned, while a
removed key in a fixed-arity expr (`diff`/`scale`), one that would empty a required list,
or a control target, throws — naming both metrics — rather than shipping a wrong value.
Pair with `sumOf` and the base needs no explicit key list at all.

## Validate, score, ship

- `bunx profile validate <file>` — strict schema + semantic lints, non-zero exit on failure.
- `bunx profile coverage <file>` — how many canonical roles are mapped and which are missing.
- `bun run build` — validate everything and emit the installable repo (`index.json` +
  `profiles/*.json`).
- In a test, `exerciseProfile(profile)` runs it end to end offline (validate → hydrate →
  manifest → capabilities → one simulated sample) — assert identity/capabilities with zero
  hardware.

## References

- Authoring guide: https://sunreye.github.io/SunReye/profiles/authoring/
- Roles & concepts (full role catalog): https://sunreye.github.io/SunReye/profiles/concept/
- Distribution: https://sunreye.github.io/SunReye/profiles/distribution/
