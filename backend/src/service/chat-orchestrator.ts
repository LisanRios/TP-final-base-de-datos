import { ChatEntity } from "../domain/chat";
import { ChatService } from "./chat.service";
import { AnalysisService } from "./analysis.service";

const chatService = new ChatService(process.env.OPENROUTER_API_KEY!);
const analysisService = new AnalysisService();

export class ChatOrchestrator {
    
    static async handleQuery(query: string): Promise<ChatEntity> {
        const aiResponse = await chatService.askAI(query);

        const allAnalyses = await analysisService.getAll();

        const relevantAnalysis = allAnalyses.find(a =>
            a.name.toLowerCase().includes(query.toLowerCase())
        );

        const combinedEntity = new ChatEntity(
            aiResponse.text,
            relevantAnalysis?.data,
            relevantAnalysis?.indicators
        );

        return combinedEntity;
    }
}
