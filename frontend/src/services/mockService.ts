import { Message } from "../components/Chat.tsx";

export const mockService = {
    getTestIndicators(): Message[] {
        const chartData = [
            { name: "Ene", value: 100 },
            { name: "Feb", value: 120 },
            { name: "Mar", value: 90 }
        ];

        const indicators = [
            { name: "RSI", value: 65 },
            { name: "SMA 50", value: 132.4 },
            { name: "Volatilidad", value: "2.5%" }
        ];

        const now = new Date().toISOString();

        return [
            { content: "Aquí están tus indicadores de prueba:", sender: "bot", timestamp: now },
            { content: "", sender: "bot", graph_type: "line", data: chartData, indicators, timestamp: now }
        ];
    }
};
