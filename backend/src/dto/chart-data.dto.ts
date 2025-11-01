export interface ChartDataDTO {
    type: 'line' | 'bar' | 'pie' | 'candlestick' | 'area';
    data: any[];
    indicators?: { name: string; value: number | string }[];
}