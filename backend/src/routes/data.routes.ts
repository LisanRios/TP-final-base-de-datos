import { Router } from 'express';
import * as dataController from '../controller/data.controller';

const router = Router();
router.get('/:id', dataController.getDataById); // '/data/id'

export default router;