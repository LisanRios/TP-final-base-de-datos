import { 
    AnalysisDatasets, 
    AnalysisIndicators, 
    ChartType 
} from '../models/analysis.types';

export class ChatEntity {
    text: string;
    
    // Propiedades opcionales que "aumentan" la respuesta
    company?: string;
    analysisId?: string;
    datasets?: AnalysisDatasets;
    indicators?: AnalysisIndicators;
    charts?: {
        default: ChartType;
        available: ChartType[];
    };

    constructor(text: string) {
        this.text = text;
    }
}