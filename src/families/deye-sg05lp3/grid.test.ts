import { describe, expect, test } from "bun:test";

import { deyeSG05LP3 } from "../deye-sg05lp3";

// The per-phase grid roles must read the external CT — the clamps at the grid
// connection point — because that is what Total Grid Power (625) sums. The
// internal CT (604-606) and 630-632 sit on the inverter's own AC port: with
// anything on the house net between the two CTs (a micro-inverter, a load) they
// disagree with the grid total. Live SG05LP3 snapshot: external -592/-583/-582 W
// summing to 625's -1757 W, internal +699/-623/-3120 W.
const phaseAddresses = (role: string) =>
  deyeSG05LP3.map((profile) => ({
    id: profile.id,
    addrs: profile.metrics
      .filter((m) => m.role === role)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map((m) => m.addresses),
  }));

describe("SG05LP3 grid phases", () => {
  test("grid.phase.power reads the external CT (616-618) on every model", () => {
    for (const { addrs } of phaseAddresses("grid.phase.power")) {
      expect(addrs).toEqual([[616], [617], [618]]);
    }
  });

  test("grid.phase.current reads the external CT current (613-615) on every model", () => {
    for (const { addrs } of phaseAddresses("grid.phase.current")) {
      expect(addrs).toEqual([[613], [614], [615]]);
    }
  });

  test("the external CT current carries no direction label: it reads as a magnitude", () => {
    // Snapshot: 2.66/2.65/2.69 A while every phase exported.
    for (const profile of deyeSG05LP3) {
      for (const m of profile.metrics.filter((x) => x.role === "grid.phase.current")) {
        expect(m.flow).toBeUndefined();
      }
    }
  });
});
