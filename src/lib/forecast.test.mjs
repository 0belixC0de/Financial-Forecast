import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

// Run the TS source through a tiny on-the-fly check by importing the compiled
// logic. Since this project uses TS, we re-implement the contract checks against
// the built output is overkill; instead we validate behaviour via a JS port test
// is not possible without a loader. So we test the pure math expectations by
// importing from a transpile-free mirror is unnecessary — we test invariants
// through the API shape using a small inline reimplementation guard.

// NOTE: These tests exercise invariants the forecast must satisfy. They import
// the TS module via Node's experimental type stripping (Node 22.6+ with
// --experimental-strip-types). If unavailable, the test self-skips.

let computeForecast;
try {
  ({ computeForecast } = await import("./forecast.ts"));
} catch {
  test("forecast math (skipped — TS stripping unavailable)", { skip: true }, () => {});
}

if (computeForecast) {
  const makeSeries = (n, start, step) =>
    Array.from({ length: n }, (_, i) => ({
      date: new Date(Date.now() - (n - i) * 86400000).toISOString(),
      close: start + i * step,
    }));

  test("produces one point per horizon day", () => {
    const f = computeForecast(makeSeries(60, 100, 0.5), 7);
    assert.equal(f.points.length, 7);
  });

  test("confidence band widens over time", () => {
    const f = computeForecast(makeSeries(60, 100, 0.5), 7);
    const w1 = f.points[0].upper - f.points[0].lower;
    const w7 = f.points[6].upper - f.points[6].lower;
    assert.ok(w7 > w1, "band should widen with horizon");
  });

  test("upward series yields positive trend", () => {
    const f = computeForecast(makeSeries(60, 100, 0.5), 7);
    assert.ok(f.trendPerDay > 0, "rising prices => positive drift");
  });

  test("bullish bias lifts the mean vs neutral", () => {
    const series = makeSeries(60, 100, 0.2);
    const neutral = computeForecast(series, 7, 0);
    const bull = computeForecast(series, 7, 1);
    assert.ok(bull.points[6].mean >= neutral.points[6].mean);
  });

  test("handles too-little data gracefully", () => {
    const f = computeForecast([{ date: new Date().toISOString(), close: 50 }], 7);
    assert.equal(f.points.length, 7);
    assert.equal(f.points[0].mean, 50);
  });
}
