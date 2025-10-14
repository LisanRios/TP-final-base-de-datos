import {
    mockLineGraph,
    mockBarsGraph,
    mockPieGraph,
    mockCandlestickGraph,
    mockAreaGraph,
} from "../data/mockData";

/**
 * Servicio que maneja los gráficos disponibles y su obtención.
 */
export const graphService = {
    getMockGraph(command: string) {
        switch (command.toLowerCase()) {
            case "/line":
                return mockLineGraph;
            case "/bar":
            return {
                graph_type: mockBarsGraph.graph_type,
                data: mockBarsGraph.data.map((d) => ({
                    name: d.date,
                    value: d.volume,
                })),
            };
            case "/pie":
                return mockPieGraph;
            case "/candlestick":
                return mockCandlestickGraph;
            case "/area":
                return mockAreaGraph;
            default:
                return null;
        }
    },
};
