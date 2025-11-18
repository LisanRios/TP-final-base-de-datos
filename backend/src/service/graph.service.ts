import { OHLC } from "../models/company.types";
import { GraphPayload, GraphType } from "../models/analysis.types";

function buildLine(h: OHLC[]): GraphPayload {
    const labels = h.map(d => d.date);
    const values = h.map(d => d.close ?? 0);
    return { type: "line", title: "Precio (Close)", data: { labels, values } };
}

function buildBarVolume(h: OHLC[]): GraphPayload {
    const labels = h.map(d => d.date);
    const values = h.map(d => d.volume ?? 0);
    return { type: "bar", title: "Volumen", data: { labels, values } };
    }

function buildArea(h: OHLC[]): GraphPayload {
    const labels = h.map(d => d.date);
    const values = h.map(d => d.close ?? 0);
    return { type: "area", title: "Área: Precio", data: { labels, values } };
}

function buildPieFromFinancial(fin: any): GraphPayload {
    const parts = fin?.breakdown || { a: 40, b: 60 };
    const labels = Object.keys(parts);
    const values = Object.values(parts);
    return { type: "pie", title: "Distribución", data: { labels, values } };
}

function buildCandlestick(h: OHLC[]): GraphPayload {
    const data = h.map((d, i) => ({
        date: d.date,
        open: d.open ?? d.close,
        high: d.high ?? d.close,
        low: d.low ?? d.close,
        close: d.close ?? 0,
    }));
    return { type: "candlestick", title: "Candlestick", data };
}

export function chooseGraphType(autoPrefer: "price" | "volume" | "composition", hist?: OHLC[], fin?: any): GraphType {
    if (autoPrefer === "volume") return "bar";
    if (autoPrefer === "composition") return "pie";
    if (hist && hist.length > 0 && (hist[0].open !== undefined && hist[0].high !== undefined)) return "candlestick";
    return "line";
}

export class GraphService {
    generate(graphType: GraphType, companyData: any): GraphPayload {
        const h = companyData.historicalData as OHLC[] | undefined;
        const fin = companyData.financialData;
        switch (graphType) {
            case "line": return buildLine(h ?? []);
            case "bar": return buildBarVolume(h ?? []);
            case "area": return buildArea(h ?? []);
            case "pie": return buildPieFromFinancial(fin);
            case "candlestick": return buildCandlestick(h ?? []);
            default: return buildLine(h ?? []);
        }
    }

    autoGenerate(companyData: any, prefer: "price" | "volume" | "composition" = "price"): GraphPayload {
        const g = chooseGraphType(prefer, companyData.historicalData, companyData.financialData);
        return this.generate(g, companyData);
    }
}
