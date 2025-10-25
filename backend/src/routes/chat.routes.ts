import { Router } from "express";
import { handleChat } from "../controller/chat.controller";

const router = Router();
router.post('/', handleChat);

export default router;
