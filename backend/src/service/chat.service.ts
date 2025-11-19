import { ChatEntity } from "../domain/chat";
import fetch from "node-fetch";

export class ChatService {
    constructor(private apiKey?: string) {}

    async askAI(payload: { query: string; json: any }): Promise<ChatEntity> {
        const { query, json } = payload;
        console.log("[askAI] Ejecutando askAI con query:", payload.query);

        // Modo real IA
        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${this.apiKey}`, 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "tngtech/deepseek-r1t2-chimera:free",
                    messages: [
                        {
                            role: "system",
                            content: `
                                Sos un analista financiero experto.
                                NUNCA inventes datos.
                                NUNCA uses ejemplos ficticios.
                                NUNCA pidas datos adicionales al usuario.
                                NUNCA digas que no tenés acceso a datos reales.

                                Tu regla absoluta:
                                👉 Respondé SOLO usando la información disponible dentro del JSON que te doy.
                                👉 Si el JSON NO tiene los datos necesarios, igual respondé, pero explicá
                                exactamente qué datos faltan en el JSON SIN pedirlos y SIN inventarlos.

                                NO agregues ejemplos numéricos.
                                NO agregues tablas ficticias.
                                NO completes datos faltantes.
                                NO uses precios inventados.

                                El usuario NO ve el JSON, por lo que NUNCA lo menciones.
                                Tu objetivo es: responder la pregunta usando EXCLUSIVAMENTE lo que haya en el JSON.
                            `
                        },
                        {
                            role: "user",
                            content:  `
                                AQUÍ ESTÁ EL CONTEXTO REAL DE LA BASE DE DATOS:
                                
                                ${JSON.stringify(json, null, 2)}
                                
                                PREGUNTA DEL USUARIO:
                                ${query}
                            `
                        }
                    ]
                })
            });
            console.log("[askAI] API KEY:", this.apiKey);

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
