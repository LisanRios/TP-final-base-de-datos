import { HistoricalDataEntry } from "../models/company.types";
import { ChartType } from "../models/analysis.types";

type GraphPayload = any;

function buildLine(h: any[]): GraphPayload {
    const labels = h.map(d => d.date);
    const values = h.map(d => d.close);
    return { type: "line", title: "Precio (Close)", data: { labels, values } };
}

function buildBarVolume(h: any[]): GraphPayload {
    const labels = h.map(d => d.date);
    const values = h.map(d => d.volume);
    return { type: "bar", title: "Volumen", data: { labels, values } };
    }

function buildArea(h: any[]): GraphPayload {
    const labels = h.map(d => d.date);
    const values = h.map(d => d.close);
    return { type: "area", title: "Área: Precio", data: { labels, values } };
}

function buildPieFromFinancial(fin: any): GraphPayload {
    const parts = fin?.breakdown || { a: 40, b: 60 };
    const labels = Object.keys(parts);
    const values = Object.values(parts);
    return { type: "pie", title: "Distribución", data: { labels, values } };
}

function buildCandlestick(h: any[]): GraphPayload {
    const data = h.map((d, i) => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
    }));
    return { type: "candlestick", title: "Candlestick", data };
}

export function chooseGraphType(autoPrefer: "price" | "volume" | "composition", hist?: HistoricalDataEntry[], fin?: any): ChartType {
    if (autoPrefer === "volume") return "bar";
    if (autoPrefer === "composition") return "pie";
    if (hist && hist.length > 0) {
        const h = hist[0];
        if (h.raw?.last_open !== undefined && h.raw?.last_max !== undefined) {
            return "candlestick";
        }
    }
    return "line";
}

export class GraphService {
    generate(graphType: ChartType, companyData: any): GraphPayload {
        const h = companyData.historicalData as HistoricalDataEntry[] | undefined;
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
