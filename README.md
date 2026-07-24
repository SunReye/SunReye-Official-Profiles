# SunReye-Official-Profiles

SunReye inverter profiles authored with [`@sunreye/profile-sdk`](https://github.com/SunReye/SunReye/tree/master/packages/profile-sdk).

## Develop

```sh
bun install
bun run build   # validate every profile in src/profiles.ts and emit index.json + profiles/*.json
```

Edit `src/profiles.ts` — every profile you export is picked up, including each
model of a `defineFamily(...)` (one self-contained profile per SKU). `bun run build`
validates them and writes the installable repo layout into this directory.

### Computed metrics and atomic reads

The engine samples all raw registers feeding a `computeExpr` (transitively) in
**one spanning Modbus read**, so derived values like efficiency never mix
registers read milliseconds apart. Keep that in mind when mapping registers:

- Keep a computed metric's raw inputs within a **120-register window**. Inputs
  further apart cannot share a Modbus transaction (per-read cap) and the
  computed metric **will glitch on fast power transients** — declare a `range`
  so the engine at least clamps it.
- The spanning read also covers the unmapped registers between the inputs, so
  the device must tolerate reading them. Devices that reject the read (Modbus
  exception 2, illegal data address) make the engine fall back to split reads —
  functional, but the transient-skew caveat above applies again.

## Publish

Commit `index.json` and `profiles/*.json`, push to a public git repo, then install
it in SunReye from Settings → Profiles.

_Scaffolded by `profile init` into `SunReye-Official-Profiles`._
