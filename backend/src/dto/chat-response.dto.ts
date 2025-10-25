export interface ChartDataDTO {
    type: 'line' | 'bar' | 'pie';
    data: any[];
}

export interface ChatResponseDTO {
    text: string;
    chart?: ChartDataDTO;
}    