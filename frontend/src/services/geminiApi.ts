/**
 * Función que simula la llamada al backend para obtener el informe financiero.
 * En un entorno real, aquí se realizaría la llamada a la API.
 * Cumple con el RNF del TP al simular una latencia de 2 a 3 segundos.
 *
 * @param {string} query La consulta de análisis enviada por el usuario.
 * @returns {Promise<object>} El objeto de informe financiero estructurado.
 */
export const fetchFinancialReport = async (query) => {
    // Simular latencia de 2 a 3 segundos
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 2000));

    // Lógica simple para simular diferentes respuestas basadas en la consulta
    const queryLower = query.toLowerCase();

    const baseReport = {
        confidence: 85,
        keyMetrics: { price: 'N/A', volatility: 'N/A', rsi: 'N/A' },
    };

    if (queryLower.includes("tesla") || queryLower.includes("tsla")) {
        return {
            ...baseReport,
            recommendation: 'MANTENER',
            asset: 'Tesla (TSLA)',
            summary: "Tesla ha mostrado una alta volatilidad recientemente. El precio se mantiene por encima de la media móvil de 50 días, pero el volumen de trading es incierto. La acción necesita consolidación.",
            keyMetrics: {
                price: "$185.30",
                volatility: "Alta (3.1% diario)",
                rsi: "55 (Neutral)",
            },
            justification: "Los fundamentales a largo plazo son sólidos, pero los indicadores técnicos a corto plazo sugieren esperar una señal clara. El RSI muestra que no está sobrecomprada ni sobrevendida."
        };
    } else if (queryLower.includes("bitcoin") || queryLower.includes("btc")) {
        return {
            ...baseReport,
            recommendation: 'COMPRA',
            asset: 'Bitcoin (BTC)',
            summary: "Bitcoin está en una fase de acumulación sólida. La serie temporal muestra soporte fuerte en $60,000, con un volumen en aumento. La tendencia general es alcista.",
            keyMetrics: {
                price: "$62,500.00",
                volatility: "Media (1.5% diario)",
                rsi: "70 (Sobrecompra)",
            },
            justification: "Fuerte tendencia ascendente validada por el RSI alto. Aunque está en zona de sobrecompra, el MACD confirma un momentum positivo y la baja volatilidad indica estabilidad relativa en la subida."
        };
    } else {
            return {
            ...baseReport,
            recommendation: 'VENTA',
            asset: 'Índice NIKKEI 225',
            summary: `Análisis solicitado para: "${query}". Los mercados asiáticos muestran signos de agotamiento y los indicadores de riesgo han aumentado significativamente en la última semana.`,
            keyMetrics: {
                price: "38,123",
                volatility: "Crítica (5.0% diario)",
                rsi: "30 (Sobrevendida)",
            },
            justification: "La IA detecta que el índice ha caído a niveles de sobreventa (RSI bajo), lo que podría indicar una corrección a la baja más profunda. La volatilidad crítica sugiere alto riesgo a corto plazo. Recomendación de salir o tomar ganancias."
        };
    }
};
