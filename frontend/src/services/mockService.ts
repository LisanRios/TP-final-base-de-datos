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

        return [
            { content: "Aquí están tus indicadores de prueba:", sender: "bot" },
            { content: "", sender: "bot", graph_type: "line", data: chartData, indicators }
        ];
    }
};
