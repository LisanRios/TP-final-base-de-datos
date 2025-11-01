import { AnalysisEntity } from "../service/analysis.service";

export const mockAnalyses: AnalysisEntity[] = [
    {
        _id: "1" as any,
        name: "Tesla 2025",
        dateCreated: new Date("2025-10-21"),
        summary: "Análisis de rendimiento de Tesla en 2025.",
        data: {
            months: ["Ene","Feb","Mar","Abr","May"],
            prices: [190, 210, 230, 225, 240]
        },
        indicators: [
            { name: "Crecimiento (%)", value: 12.5 },
            { name: "Media móvil", value: 220.3 }
        ]
    },
    {
        _id: "2" as any,
        name: "Apple 2025",
        dateCreated: new Date("2025-10-20"),
        summary: "Evaluación general de las acciones de Apple durante 2025.",
        data: {
            months: ["Ene","Feb","Mar","Abr","May"],
            prices: [180, 182, 178, 190, 200]
        },
        indicators: [
            { name: "Volatilidad (%)", value: 2.4 },
            { name: "Tendencia", value: "Alcista" }
        ]
    }
];
