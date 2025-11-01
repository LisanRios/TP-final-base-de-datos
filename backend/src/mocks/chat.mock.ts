export const mockChatResponses = [
    {
        query: "Hola",
        response: "¡Hola! Soy tu asistente financiero. ¿Querés analizar alguna empresa?"
    },
    {
        query: "Analizá Bitcoin",
        response: JSON.stringify({
            text: "El precio de Bitcoin hoy es de $31,500."
            // No se recomienda gráfico porque es un dato puntual
        })
    },
    {
        query: "Analizá Amazon",
        response: JSON.stringify({
            text: "Amazon muestra tendencias mixtas en 2025.",
            graph_type: "area",
            data: [{ month: "Ene", value: 120 }, { month: "Feb", value: 150 }, { month: "Mar", value: 140 }]
        })
    },
    {
        query: "Analizá Netflix",
        response: JSON.stringify({
            text: "Netflix tuvo movimientos volátiles en el último mes.",
            graph_type: "candlestick",
            data: [
                { date: "2025-09-01", open: 100, high: 120, low: 90, close: 110 },
                { date: "2025-09-02", open: 110, high: 130, low: 105, close: 125 }
            ]
        })
    },
    {
        query: "/pie",
        response: JSON.stringify({
            text: "Distribución de inversión en sectores",
            graph_type: "pie",
            data: [{ category: "Tech", value: 40 }, { category: "Finance", value: 30 }, { category: "Health", value: 30 }]
        })
    }
];
