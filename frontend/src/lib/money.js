// src/lib/money.js
// ─────────────────────────────────────────────────────────────────────────────
// Money is plain BDT with up to 2 decimals (e.g. 120, 12.5, 14025.54).
// Use these helpers for any money value the frontend computes, so results land
// on whole paisa. The small epsilon guards against float error (0.29 * 100 = 28.999…).
// ─────────────────────────────────────────────────────────────────────────────

const EPS = 1e-7;

// Round to the nearest paisa: 12.345 → 12.35, 14025.544 → 14025.54
export const roundMoney = (value) => Math.round((Number(value) || 0) * 100 + EPS) / 100;

// Round down to the paisa: 8% of 99.99 → 7.99
export const floorMoney = (value) => Math.floor((Number(value) || 0) * 100 + EPS) / 100;
