/**
 * Storage classes and deadbands (SunReye's storage-wear work).
 *
 * Two fields decide how much of this map reaches disk, and both are stated here
 * rather than derived downstream, because only the vendor map says what a
 * register is worth keeping:
 *
 * - `storage` - `config` (the default for every writable register) keeps a
 *   change-log instead of a timeseries row per poll; the configuration registers
 *   in this map were a third of every row the app wrote. The four current/power
 *   limits the automation engine writes are marked `series` explicitly: their
 *   history charts against battery power and is worth keeping. `settings/system_time`
 *   is `none` - a packed RAW register is never part of the numeric sample, so
 *   there is no series to keep.
 * - `deadband` - the smallest change worth storing, in the register's own unit,
 *   compared against the last value actually *stored* (so the stored series is
 *   never wrong by more than the threshold). Absent means every change is kept,
 *   which is what counters and enums get: a threshold makes a counter lag and can
 *   swallow a state transition.
 *
 * The values are conservative and uniform per unit, chosen to sit above the
 * register's own quantisation step and well inside instrument noise:
 *
 * | Unit | Deadband | Reasoning |
 * | --- | --- | --- |
 * | W | 20 | ~0.2 % of a 10 kW inverter, above the coarsest power step (10 W) |
 * | V (AC/PV) | 1 | ~0.4 % of 230 V, 10x the 0.1 V register step |
 * | V (battery) | 0.1 | ~0.2 % of a 48 V pack, 10x the 10 mV step |
 * | A | 0.2 | 20x the 10 mA step; 1 A-resolution registers get none |
 * | °C | 0.5 | 5x the register step, below any real thermal excursion |
 * | % (efficiency) | 1 | a computed ratio; one point is inside its own noise |
 *
 * Raise them per model if a site is noisier; each one can only cost fidelity
 * bounded by the number itself.
 */

export const CHARGE_FLOW = { positive: "Discharging", negative: "Charging" } as const;
export const GRID_FLOW = { positive: "Importing", negative: "Exporting" } as const;
