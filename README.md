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

## Publish

Commit `index.json` and `profiles/*.json`, push to a public git repo, then install
it in SunReye from Settings → Profiles.

_Scaffolded by `profile init` into `SunReye-Official-Profiles`._
