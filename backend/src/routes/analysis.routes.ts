import { Router } from 'express';
import * as analysisController from '../controller/analysis.controller';

const router = Router();

router.get('/', analysisController.getReportById); // '/report/id'

module.exports = router;