import { Router } from 'express';
import { analysisController } from "../controller/analysis.controller";

const router = Router();

router.get("/", analysisController.getAllAnalyses);

router.get("/:id", analysisController.getAnalysisById);

export default router;
