import { Request, Response } from "express";
import { ChatOrchestrator } from "../service/chat-orchestrator";
import { ChatMapper } from "../utils/chat-mapper";

export const handleChat = async (req: Request, res: Response) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    try {
        const entity = await ChatOrchestrator.handleQuery(query);
        const dto = ChatMapper.toDTO(entity);
        res.json(dto);
    } catch (err: any) {
        console.error('Error chat:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
};
