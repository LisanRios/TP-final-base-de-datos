export interface HistoricalDataEntry {
    rowDate: string;
    last_closeRaw: string;
    last_openRaw: string;
    last_maxRaw: string;
    last_minRaw: string;
    volumeRaw: number;
    change_precentRaw: string;
    dateRaw: string;
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
