import { Request, Response } from "express";
import { ChatService } from "../service/chat.service";
import { ChatMapper } from "../utils/chat-mapper";
import { ENV } from "../config/env";

const chatService = new ChatService(ENV.OPENROUTER_API_KEY!);

export const handleChat = async (req: Request, res: Response) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    try {
        const entity = await chatService.askAI(query);
        const dto = ChatMapper.toDTO(entity);
        res.json(dto);
    } catch (err: any) {
        console.error('Error chat:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
};
