import { describe, it, expect } from "vitest";
import {
  normalizeLineData,
  normalizeBarData,
  normalizePieData,
  normalizeCandlestickData,
  normalizeAreaData,
} from "./dataNormalizer";

describe("normalizeLineData", () => {
    it("debe mapear correctamente date y price/value/amount", () => {
      const raw = [
        { date: "2025-10-16", price: 100 },
        { date: "2025-10-17", value: 200 },
        { date: "2025-10-18", amount: 300 },
        { date: "2025-10-19" },
        {}, 
        { price: null }, 
      ];

      const result = normalizeLineData(raw);

      expect(result).toEqual([
        { date: "2025-10-16", price: 100 },
        { date: "2025-10-17", price: 200 },
        { date: "2025-10-18", price: 300 },
        { date: "2025-10-19", price: 0 },
        { date: undefined, price: 0 },
        { date: undefined, price: 0 },
      ]);
    });

    it("debe manejar array vacío sin errores", () => {
      expect(normalizeAreaData([])).toEqual([]);
    });
});

describe("normalizeBarData", () => {
  it("debería mapear correctamente los objetos con name y value", () => {
    const raw = [
      { name: "A", value: 10 },
      { volume: 20 },
      { date: "2025-10-16", value: 5 },
      { value: undefined },
      {},
    ];

    const result = normalizeBarData(raw);

    expect(result).toEqual([
      { name: "A", value: 10 },
      { name: "N/A", value: 20 },
      { name: "2025-10-16", value: 5 },
      { name: "N/A", value: 0 },
      { name: "N/A", value: 0 },
    ]);
  });

  it("debería devolver un array de la misma longitud que el input", () => {
    const raw = [
      { name: "Test", value: 1 },
      { name: "Otro", value: 2 },
    ];
    const result = normalizeBarData(raw);

    expect(result).toHaveLength(raw.length);
  });

    it("debe manejar array vacío sin errores", () => {
      expect(normalizeBarData([])).toEqual([]);
    });
});

describe("normalizePieData", () => {
  it("debe mapear correctamente name y value", () => {
    const raw = [
      { name: "BTC", value: 1000 },
      { date: "2025-10-16", amount: 500 },
      { asset: "ETH", value: 300 },
      {},
      { value: null }
    ];

    const result = normalizePieData(raw);

    expect(result).toEqual([
      { name: "BTC", value: 1000 },
      { name: "2025-10-16", value: 500 },
      { name: "ETH", value: 300 },
      { name: "N/A", value: 0 },
      { name: "N/A", value: 0 },
    ]);
  });

  it("debe manejar array vacío sin errores", () => {
    expect(normalizePieData([])).toEqual([]);
  });
});

describe("normalizeCandlestickData", () => {
  it("debe mapear correctamente index, date, open, close, high, low", () => {
    const raw = [
      { date: "2025-10-16", open: 10, close: 15, high: 20, low: 5 },
      { date: "2025-10-17", open: 12, close: 18, high: 22, low: 8 },
      { open: 12 }, 
      {}, 
    ];

    const result = normalizeCandlestickData(raw);

    expect(result).toEqual([
      { index: 0, date: "2025-10-16", open: 10, close: 15, high: 20, low: 5 },
      { index: 1, date: "2025-10-17", open: 12, close: 18, high: 22, low: 8 },
      {
        index: 2,
        date: undefined,
        open: 12,
        close: undefined,
        high: undefined,
        low: undefined,
      },
      {
        index: 3,
        date: undefined,
        open: undefined,
        close: undefined,
        high: undefined,
        low: undefined,
      },
    ]);
  });

  it("debe manejar array vacío sin errores", () => {
    expect(normalizeCandlestickData([])).toEqual([]);
  });
});

describe("normalizeAreaData", () => {
  it("debe mapear correctamente date y value/price", () => {
    const raw = [
      { date: "2025-10-16", value: 100 },
      { date: "2025-10-17", price: 200 },
      { date: "2025-10-18" }, 
      {}, 
      { value: null }, 
    ];

    const result = normalizeAreaData(raw);

    expect(result).toEqual([
      { date: "2025-10-16", value: 100 },
      { date: "2025-10-17", value: 200 },
      { date: "2025-10-18", value: 0 },
      { date: undefined, value: 0 },
      { date: undefined, value: 0 },
    ]);
  });

  it("debe manejar array vacío sin errores", () => {
    expect(normalizeAreaData([])).toEqual([]);
  });
});

