export interface LineDataset {
    dates: string[];
    closes: number[];
}

export interface CandleDataset {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface VolumeDataset {
    dates: string[];
    volume: number[];
}

export interface AreaDataset {
    dates: string[];
    values: number[];
}

export interface PieDataset {
    labels: string[];
    values: number[];
}

export type ChartType =
    "line" |
    "candlestick" |
    "bar" |
    "area" |
    "pie";

export interface AnalysisDatasets {
    line?: LineDataset;
    candlestick?: CandleDataset[];
    volume?: VolumeDataset;
    area?: AreaDataset;
    pie?: PieDataset;
}

export interface AnalysisIndicators {
    rsi: number;
    macd: number;
    adx: number;
    volatility: number;
    trend: "alcista" | "bajista" | "neutral";
}

export interface AnalysisEntity {
    _id?: string;
    company: string;
    companyId: string;
    generatedAt: Date | string;
    summary: string;

    charts: {
        default: ChartType;
        available: ChartType[];
    };

    datasets: AnalysisDatasets;

    indicators: AnalysisIndicators;
}
