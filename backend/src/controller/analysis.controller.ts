import { Request, Response } from "express";
import { AnalysisService } from "../service/analysis.service";
import { AnalysisMapper } from "../utils/analysis-mapper";

const analysisService = new AnalysisService();

export class analysisController {
    static async getAllAnalyses(req: Request, res: Response) {
        try {
            const analyses = await analysisService.getAll();
            const dtoList = analyses.map(AnalysisMapper.toDTO);
            res.json(dtoList);
        } catch (err: any) {
            console.error("Error getting analyses:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    static async getAnalysisById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const analysis = await analysisService.getById(id);

            if (!analysis) {
                return res.status(404).json({ error: "Analysis not found" });
            }

            const dto = AnalysisMapper.toDetailDTO(analysis);
            res.json(dto);
        } catch (err: any) {
            console.error("Error getting analysis by id:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}