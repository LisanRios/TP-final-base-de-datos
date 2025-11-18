import { HistoricalDataEntry } from "../models/company.types";
import { ChartType } from "../models/analysis.types";

type GraphPayload = any;

function buildLine(h: HistoricalDataEntry[]): GraphPayload {
    const labels = h.map(d => d.rowDate);
    const values = h.map(d => d.last_closeRaw ?? 0);
    return { type: "line", title: "Precio (Close)", data: { labels, values } };
}

function buildBarVolume(h: HistoricalDataEntry[]): GraphPayload {
    const labels = h.map(d => d.rowDate);
    const values = h.map(d => d.last_closeRaw ?? 0);
    return { type: "bar", title: "Volumen", data: { labels, values } };
    }

function buildArea(h: HistoricalDataEntry[]): GraphPayload {
    const labels = h.map(d => d.rowDate);
    const values = h.map(d => d.last_closeRaw ?? 0);
    return { type: "area", title: "Área: Precio", data: { labels, values } };
}

function buildPieFromFinancial(fin: any): GraphPayload {
    const parts = fin?.breakdown || { a: 40, b: 60 };
    const labels = Object.keys(parts);
    const values = Object.values(parts);
    return { type: "pie", title: "Distribución", data: { labels, values } };
}

function buildCandlestick(h: HistoricalDataEntry[]): GraphPayload {
    const data = h.map((d, i) => ({
        date: d.rowDate,
        open: d.last_openRaw ?? d.last_closeRaw,
        high: d.last_maxRaw ?? d.last_closeRaw,
        low: d.last_minRaw ?? d.last_closeRaw,
        close: d.last_closeRaw ?? 0,
    }));
    return { type: "candlestick", title: "Candlestick", data };
}

export function chooseGraphType(autoPrefer: "price" | "volume" | "composition", hist?: HistoricalDataEntry[], fin?: any): ChartType {
    if (autoPrefer === "volume") return "bar";
    if (autoPrefer === "composition") return "pie";
    if (hist && hist.length > 0 && (hist[0].last_openRaw !== undefined && hist[0].last_maxRaw !== undefined)) return "candlestick";
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
