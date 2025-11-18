import { ChatEntity } from "../domain/chat";
import fetch from "node-fetch";

export class ChatService {
    constructor(private apiKey?: string) {}

    async askAI(query: string): Promise<ChatEntity> {
        const lowerQuery = query.toLowerCase().trim();
    
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
