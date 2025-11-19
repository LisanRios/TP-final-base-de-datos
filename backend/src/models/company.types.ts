export interface HistoricalRawData {
    last_close: number; // o string, si los valores en MongoDB son strings
    last_open: number; // o string
    last_max: number; // o string
    last_min: number; // o string
    volume: number;
    change: number
}

export interface HistoricalDataEntry {
        date: string; // La fecha principal que usas
        raw: HistoricalRawData; // La data anidada de precios y volumen
        text: string;
        vector: number[]; // El vector
    }

export interface TechnicalIndicatorValue {
    name: string;
    value: string;
}

export interface TechnicalSummary {
    buy: number;
    sell: number;
    neutral: number;
}

export interface TechnicalData {
    rsi: TechnicalIndicatorValue;
    macd: TechnicalIndicatorValue;
    stochastich: TechnicalIndicatorValue;
    adx: TechnicalIndicatorValue;
    cci: TechnicalIndicatorValue;
    atr: TechnicalIndicatorValue;

    indicators: {
        summary: TechnicalSummary;
    };
}

export interface FinancialData {
    [key: string]: any;
}

export interface CompanyEntity {
    _id: string;
    company: string;
    historicalData: HistoricalDataEntry[];
    technicalData: TechnicalData;
    financialData: FinancialData;
    createdAt: Date | string;
}
