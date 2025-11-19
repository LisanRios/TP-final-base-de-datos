import { ChartDataDTO } from './chart-data.dto';

export interface ChatResponseDTO {
    text: string;
    chart?: ChartDataDTO;
}