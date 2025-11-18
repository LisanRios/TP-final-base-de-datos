import { AnalysisEntity } from "../models/analysis.types";

export interface AnalysisSummaryDto {
    id: string;
    name: string;
    dateCreated: string;
}

export interface AnalysisDetailDto {
    id: string;
    name: string;
    dateCreated: string;
    summary: string;
    data: any;
    indicators: { name: string; value: string | number; }[];
}

export class AnalysisMapper {
    static toDTO(entity: AnalysisEntity): AnalysisSummaryDto {
        return {
            id: entity._id?.toString() || "",
            name: entity.company,
            dateCreated: entity.generatedAt
                ? (entity.generatedAt instanceof Date ? entity.generatedAt.toISOString() : entity.generatedAt)
                : "",
        };
    }

    static toDetailDTO(entity: AnalysisEntity): AnalysisDetailDto {
        return {
            id: entity._id?.toString() || "",
            name: entity.company,
            dateCreated: entity.generatedAt
                ? (entity.generatedAt instanceof Date ? entity.generatedAt.toISOString() : entity.generatedAt)
                : "",
            summary: entity.summary,
            data: entity.datasets,
            indicators: Object.entries(entity.indicators).map(([key, value]) => ({
                name: key,
                value: value
            })),
        };
    }
}
