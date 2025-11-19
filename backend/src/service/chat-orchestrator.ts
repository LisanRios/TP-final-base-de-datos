// service/chat-orchestrator.ts

import { ChatEntity } from "../domain/chat";
import { ChatService } from "./chat.service";
import { AnalysisService } from "./analysis.service";
import { CompanyService } from "./company.service"; // <-- NECESARIO
import { AnalysisEntity } from "../models/analysis.types"; // <-- ÚTIL

// Instanciamos todos los servicios que necesitamos
const chatService = new ChatService(process.env.OPENROUTER_API_KEY);
const analysisService = new AnalysisService();
const companyService = new CompanyService(); // <-- NECESARIO

export class ChatOrchestrator {
    
    static async handleQuery(input: { query: string; json: any }): Promise<ChatEntity> {
        const { query, json } = input;
        console.log("[handleQuery] query recibida:", query);

        // 1. Buscar la compañía relevante según la consulta
        const minimalCompany = await companyService.findCompanyFromQuery(query);

        if (!minimalCompany) {
            return await chatService.askAI({ query, json: { query } });
        }
        
        // obtener el CompanyEntity completo:
        const company = await companyService.findBySlug(minimalCompany.company);
        
        if (!company) {
            return await chatService.askAI({ query, json: { query } });
        }

        // 2. Si no encontramos compañía (o la consulta es genérica como "hola")
        if (!company) {
            // chatService.askAI ya devuelve un ChatEntity (solo con texto)
            return await chatService.askAI({ query, json: { query } });
        }

        // 3. Si encontramos compañía, buscamos un análisis (CACHÉ)
        let analysis: AnalysisEntity | null = null;
        
        try {
            const companyId = typeof company._id === 'string' ? company._id : String(company._id);
            analysis = await analysisService.getLatestForCompany(companyId);
            // 4. Si NO hay análisis, lo generamos (CACHE MISS)
            if (!analysis) {
                console.log(`[ChatOrchestrator] No analysis found for ${company.company}. Generating...`);
                analysis = await analysisService.generateAndSave(company, query);
            }
            
        } catch (genError: any) {
            console.error(`[ChatOrchestrator] Error finding or generating analysis: ${genError.message}`);
            // Si falla la generación, al menos devolvemos una respuesta de IA genérica
            return await chatService.askAI({ query, json: { query } });
        }
        
        if (!analysis) {
            console.error("[ChatOrchestrator] Analysis is null after try/catch. Fallback to AI.");
            return await chatService.askAI({ query, json: { query } });
        }

        // 5. CONSTRUIR EL CONTEXTO (El "Augmented" de RAG)
        const context = `
            Información de contexto para la compañía ${analysis.company} (generado el ${analysis.generatedAt}):
            Resumen de análisis: ${analysis.summary}
            Indicadores Clave:
            - RSI: ${analysis.indicators.rsi.toFixed(2)}
            - MACD: ${analysis.indicators.macd.toFixed(2)}
            - Tendencia: ${analysis.indicators.trend}
            - Volatilidad: ${analysis.indicators.volatility.toFixed(2)}%
        `;

        // 6. CREAR EL PROMPT FINAL PARA LA IA
        const dbContext = {
            query,
            company,
            analysis,
            datasets: analysis.datasets,
            indicators: analysis.indicators,
            charts: analysis.charts
        };

        // 7. Llamar a la IA (ahora con superpoderes)
        try {
            const aiResponse = await chatService.askAI({
                query,
                json: dbContext
            });
            aiResponse.company = analysis.company;
            aiResponse.analysisId = analysis._id?.toString(); // <-- MUY IMPORTANTE
            aiResponse.datasets = analysis.datasets;
            aiResponse.indicators = analysis.indicators;
            aiResponse.charts = analysis.charts;

            return aiResponse;
        } catch (err: any) {
            console.error("[handleQuery] Error en askAI:", err.message);
            return new ChatEntity("Hubo un error al conectar con la IA.");
        }
        // 8. ADJUNTAR DATOS A LA RESPUESTA
        
    }
}