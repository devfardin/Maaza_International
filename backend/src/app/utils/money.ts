// ─────────────────────────────────────────────────────────────────────────────
// Money helpers.
// Amounts are STORED and RETURNED in BDT, e.g. 120, 12.5, 14025.54 (2 decimals max).
// Calculations are done in paisa (whole numbers, 1 BDT = 100 paisa) so results are
// exact, and then converted back to BDT. Paisa is never written to the database.
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';

// BDT → paisa (calculation only)
export const toPaisa = (bdt: number): number => Math.round(Number(bdt) * 100);

// paisa → BDT
export const fromPaisa = (paisa: number): number => Math.round(paisa) / 100;

// Rounds any BDT amount to whole paisa
export const roundMoney = (bdt: number): number => fromPaisa(toPaisa(bdt));

// A share of an amount (rate is a fraction, e.g. 0.08 for 8%), floored to whole paisa
export const shareOf = (bdt: number, rate: number): number =>
  fromPaisa(Math.floor(toPaisa(bdt) * rate + 1e-9));

// Part of a daily amount for a number of hours (income for a claim), floored to whole paisa
export const proRata = (dailyBdt: number, hours: number): number =>
  fromPaisa(Math.floor((toPaisa(dailyBdt) * hours) / 24 + 1e-9));

// True when the amount has at most 2 decimals
export const isMoneyAmount = (value: number): boolean =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

// Display text, e.g. 12 → "৳12.00"
export const moneyText = (bdt: number, digits = 2): string => `৳${Number(bdt || 0).toFixed(digits)}`;

// Validation for a money input: a number in BDT with at most 2 decimals
export const moneySchema = (message = 'Amount must be a number') =>
  z.number({ message }).refine(isMoneyAmount, 'Amounts can have at most 2 decimal places (e.g. 12.50)');

// Atomic wallet change inside MongoDB: balance + delta, rounded to paisa,
// so repeated decimal additions never drift (e.g. 0.1 + 0.2).
export const moneyIncrement = (field: string, delta: number) => [
  { $set: { [field]: { $round: [{ $add: [`$${field}`, roundMoney(delta)] }, 2] } } },
];
