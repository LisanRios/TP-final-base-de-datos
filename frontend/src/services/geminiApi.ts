/**
 * Función que llama al backend para obtener la respuesta del chat.
 * @param {string} query La consulta del usuario.
 * @returns {Promise<{response: string}>} La respuesta de la IA.
 */
export const fetchChatResponse = async (query: string): Promise<{response: string}> => {
    // === MOCK TEMPORAL: Simula la lógica del backend ===
    return mockFetchChatResponse(query);
};

// Palabras clave relacionadas con finanzas
const financialKeywords = [
    "finanzas", "inversión", "bolsa", "acciones", "dividendos", 
    "rentabilidad", "presupuesto", "inflación", "análisis financiero", 
    "ratios", "contabilidad", "balance", "ingresos", "gastos", "capital",
    "mercado", "criptomonedas", "hipoteca", "deuda", "patrimonio"
];

/**
 * MOCK: Simula la llamada asíncrona al backend y genera una respuesta
 * basada en si la consulta contiene palabras clave financieras.
 * @param {string} query La consulta del usuario.
 * @returns {Promise<{response: string}>} La respuesta simulada.
 */
const mockFetchChatResponse = async (query: string): Promise<{response: string}> => {
    const normalizedQuery = query.toLowerCase();
    
    // Simula una latencia de red de 0.5 a 1.5 segundos
    const delay = Math.random() * 1000 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Comprueba si la consulta contiene alguna palabra clave financiera
    const isFinancialQuery = financialKeywords.some(keyword => normalizedQuery.includes(keyword));

    if (isFinancialQuery) {
        // Respuesta mock para consultas financieras
        let mockResponse = `Entiendo que tu consulta: "${query}" está relacionada con el ámbito financiero. Como Asistente IA Financiero, puedo proporcionarte el siguiente análisis simulado:\n\nEl **Ratio de Liquidez Corriente** para el último período (simulado) fue de **1.85**. Esto sugiere que la empresa tiene suficiente activo circulante para cubrir sus pasivos a corto plazo. Es un indicador positivo, aunque debe analizarse en el contexto de la industria.`;
        
        // Mocks adicionales para variar la respuesta
        if (normalizedQuery.includes("inversión") || normalizedQuery.includes("acciones")) {
            mockResponse = `En un escenario de inversión simulado, la recomendación para la acción 'XYZ' es **MANTENER**. Los indicadores sugieren una estabilidad a corto plazo, con un potencial de crecimiento del 7% en los próximos 12 meses.`;
        } else if (normalizedQuery.includes("presupuesto") || normalizedQuery.includes("deuda")) {
            mockResponse = `Tu consulta sobre **${query}** es crucial para una gestión efectiva. Recuerda que la 'Regla 50/30/20' (necesidades/deseos/ahorro) es una base sólida para el control presupuestario personal.`;
        }
        
        return { response: mockResponse };
    } else {
        // Respuesta de "error" o fuera de contexto para otras consultas
        throw new Error("Consulta fuera de contexto financiero.");
    }
};