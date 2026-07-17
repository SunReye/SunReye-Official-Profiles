// Aggregator entry point for `profile build`. Each inverter family lives in its
// own file under ./families; re-export it here and the build picks up every
// profile it emits (defineFamily returns [base, ...models]). Add a new family by
// dropping a file in ./families and adding one line below.
export { deyeSG01HP3 } from "./families/deye-sg01hp3";
export { deyeSG05LP3 } from "./families/deye-sg05lp3";
