import { AnalysisEntity } from "../service/analysis.service";

export interface AnalysisSummaryDto {
    id: string;
    name: string;
    dateCreated: string;
}

export interface AnalysisDetailDto extends AnalysisSummaryDto {
    summary?: string;
    data?: any;
    indicators?: { name: string; value: number | string }[];
}

export class AnalysisMapper {
    static toDTO(entity: AnalysisEntity): AnalysisSummaryDto {
        return {
            id: entity._id?.toString() || "",
            name: entity.name,
            dateCreated: entity.dateCreated?.toISOString() || "",
        };
    }

    static toDetailDTO(entity: AnalysisEntity): AnalysisDetailDto {
        return {
            id: entity._id?.toString() || "",
            name: entity.name,
            dateCreated: entity.dateCreated?.toISOString() || "",
            summary: entity.summary,
            data: entity.data,
            indicators: entity.indicators,
        };
    }
}
