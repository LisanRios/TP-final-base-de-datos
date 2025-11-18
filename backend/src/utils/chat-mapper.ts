import { ChatEntity } from "../domain/chat";
import { 
    AnalysisDatasets, 
    AnalysisIndicators, 
    ChartType 
} from "../models/analysis.types";

// --- DTOs (Data Transfer Objects) ---
// Estos definen la "forma" de los datos que van al frontend.

/**
 * Define la estructura de un gráfico individual enviado al frontend
 */
export interface ChartDataDTO {
    type: ChartType;
    data: any; // Los datos (ej. LineDataset, CandleDataset[], etc.)
}

/**
 * Define la respuesta completa del chat enviada al frontend.
 * Es más completa que la anterior, incluye los indicadores, 
 * el gráfico por defecto (chart) y la lista de gráficos disponibles (charts).
 */
export interface ChatResponseDTO {
    text: string;
    company?: string;
    analysisId?: string;
    indicators?: AnalysisIndicators;
    charts?: { // La configuración de gráficos
        default: ChartType;
        available: ChartType[];
    };
    chart?: ChartDataDTO; // El gráfico por defecto, listo para renderizar
}


// --- Mapper ---

export class ChatMapper {

    /**
     * Convierte la ChatEntity (del backend) a un ChatResponseDTO (para el frontend).
     * Extrae el gráfico por defecto y sus datos.
     */
    static toDTO(entity: ChatEntity): ChatResponseDTO {
        
        // 1. Mapeo base (texto, indicadores, etc.)
        const dto: ChatResponseDTO = {
            text: entity.text,
            company: entity.company,
            analysisId: entity.analysisId,
            indicators: entity.indicators,
            charts: entity.charts
        };

        // 2. Lógica para adjuntar el gráfico por defecto (lo que fallaba)
        //    (Soluciona el error TS2551: 'chart' vs 'charts')
        if (entity.charts && entity.datasets) {
            const defaultChartType = entity.charts.default;
            const datasets = entity.datasets;
            let chartData: any = null;

            // Busca los datos correspondientes al gráfico por defecto
            switch (defaultChartType) {
                case 'line':
                    chartData = datasets.line;
                    break;
                case 'candlestick':
                    chartData = datasets.candlestick;
                    break;
                case 'bar': // 'bar' en types se refiere a 'volume' en datasets
                    chartData = datasets.volume;
                    break;
                case 'area':
                    chartData = datasets.area;
                    break;
                case 'pie':
                    chartData = datasets.pie;
                    break;
            }

            // Si encontramos los datos, los adjuntamos al DTO
            if (chartData) {
                dto.chart = {
                    type: defaultChartType,
                    data: chartData
                };
            }
        }

        return dto;
    }

    /**
     * Convierte un DTO (del frontend) a una ChatEntity (para el backend).
     * (Usado al recibir la consulta)
     */
    static toEntity(dto: { text: string }): ChatEntity {
        if (!dto.text) {
            throw new Error("El texto (query) no puede estar vacío");
        }

        // CORRECCIÓN (Soluciona el error TS2554: 2 argumentos vs 1)
        // El constructor de ChatEntity solo acepta 1 argumento (el texto).
        const entity = new ChatEntity(dto.text);
        
        return entity;
    }
}