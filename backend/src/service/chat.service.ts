import { ChatEntity } from "../domain/chat";
import fetch from "node-fetch";

export class ChatService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async askAI(query: string): Promise<ChatEntity> {
        // Comandos simulados
        if (query.toLowerCase() === '/line') {
            return new ChatEntity('Gráfico de línea generado 📈', {
                type: 'line',
                data: [{ date: '2025-09-01', price: 120 }]
            });
        }

        if (query.toLowerCase() === '/bar') {
            return new ChatEntity('Gráfico de barras generado 📊', {
                type: 'bar',
                data: [{ name: 'Volumen', value: 4000 }]
            });
        }

        // Llamada real a DeepSeek / OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat-v3.1:free',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: query }
                ]
            })
        });

        const data: any = await response.json();
        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }

        const responseText = data.choices[0].message.content;
        return new ChatEntity(responseText);
    }
}