import { ChatEntity } from "../domain/chat";
import { mockChatResponses } from "../mocks/chat.mock";
import { mockAnalyses } from "../mocks/analysis.mock";
import fetch from "node-fetch";

export class ChatService {
    private useMock = process.env.USE_MOCK === "true";

    constructor(private apiKey?: string) {}

    async askAI(query: string): Promise<ChatEntity> {
        const lowerQuery = query.toLowerCase().trim();
    
        // Modo MOCK
        if (this.useMock) {
            // Buscar análisis relevante por palabra clave
            const relevantAnalysis = mockAnalyses.find(a =>
                lowerQuery.includes(a.name.split(' ')[0].toLowerCase())
            );
    
            if (relevantAnalysis) {
                return new ChatEntity(
                    `Podés ver el análisis completo de ${relevantAnalysis.name} aquí: /api/analysis/${relevantAnalysis._id}`,
                    relevantAnalysis.data ? {
                        type: 'line', // luego se decide cual grafico usar
                        data: relevantAnalysis.data
                    } : undefined
                );
            }
    
            // Si no hay análisis, fallback a mockChatResponses
            const mock = mockChatResponses.find(m => m.query.toLowerCase() === lowerQuery);
            if (mock) {
                try {
                    const parsed = JSON.parse(mock.response);
                    return new ChatEntity(parsed.text, parsed.graph_type ? {
                        type: parsed.graph_type,
                        data: parsed.data
                    } : undefined);
                } catch {
                    return new ChatEntity(mock.response);
                }
            }
    
            return new ChatEntity("No tengo datos mockeados para esa consulta 🤖");
        }
    
        // Modo real IA
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${this.apiKey}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-chat-v3.1:free",
                    messages: [
                        { role:"system", content:"You are a helpful financial assistant." },
                        { role:"user", content: query }
                    ]
                })
            });
    
            const data: any = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "Error from AI service");
    
            const responseText = data.choices?.[0]?.message?.content || "No se recibió respuesta.";
            return new ChatEntity(responseText);
    
        } catch (err: any) {
            console.error("AI request failed:", err);
            return new ChatEntity("Hubo un error al conectar con la IA.");
        }
    }    
}
