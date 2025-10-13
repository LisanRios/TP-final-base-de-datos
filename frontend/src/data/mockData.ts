export const mockLineGraph = {
    graph_type: "line",
    data: [
        { date: "2025-09-01", price: 120 },
        { date: "2025-09-02", price: 130 },
        { date: "2025-09-03", price: 128 },
    ],
};

export const mockBarsGraph = {
    graph_type: "bar",
    data: [
        { date: "2025-09-01", volume: 4000 },
        { date: "2025-09-02", volume: 3200 },
        { date: "2025-09-03", volume: 5100 },
    ],
};

export const mockPieGraph = {
    graph_type: "pie",
    data: [
        { date: "BTC", value: 40 },
        { date: "ETH", value: 30 },
        { date: "ADA", value: 30 },
    ],
};

export const mockCandlestickGraph = {
    graph_type: "candlestick",
    data: [
        { index: 0, date: "2025-09-01", open: 100, close: 105, high: 106, low: 99 },
        { index: 1, date: "2025-09-02", open: 105, close: 115, high: 116, low: 104 },
        { index: 2, date: "2025-09-03", open: 115, close: 114, high: 118, low: 113 },
        { index: 3, date: "2025-09-04", open: 114, close: 125, high: 126, low: 113.5 },
        { index: 4, date: "2025-09-05", open: 125, close: 124.5, high: 127, low: 124 },
        { index: 5, date: "2025-09-06", open: 124.5, close: 123, high: 125.5, low: 122.5 },
        { index: 6, date: "2025-09-07", open: 123, close: 128, high: 129, low: 122.5 },
        { index: 7, date: "2025-09-08", open: 128, close: 130, high: 131, low: 127 },
        { index: 8, date: "2025-09-09", open: 130, close: 129, high: 131.5, low: 128.5 },
        { index: 9, date: "2025-09-10", open: 129, close: 135, high: 136, low: 128.8 },
        { index: 10, date: "2025-09-11", open: 135, close: 134.8, high: 136, low: 133 },
        { index: 11, date: "2025-09-12", open: 134.8, close: 120, high: 135, low: 119 },
        { index: 12, date: "2025-09-13", open: 120, close: 118, high: 121, low: 117.5 },
        { index: 13, date: "2025-09-14", open: 118, close: 110, high: 118.5, low: 109 },
        { index: 14, date: "2025-09-15", open: 110, close: 110.5, high: 111, low: 109.5 },
        { index: 15, date: "2025-09-16", open: 110.5, close: 103, high: 110.7, low: 102 },
        { index: 16, date: "2025-09-17", open: 103, close: 104, high: 105, low: 102.5 },
        { index: 17, date: "2025-09-18", open: 104, close: 95, high: 104.5, low: 94 },
        { index: 18, date: "2025-09-19", open: 95, close: 95.5, high: 96, low: 94.5 },
        { index: 19, date: "2025-09-20", open: 95.5, close: 100, high: 101, low: 95 },
    ],
};

export const mockAreaGraph = {
    graph_type: "area",
    data: [
        { date: "2025-09-01", value: 100 },
        { date: "2025-09-02", value: 120 },
        { date: "2025-09-03", value: 115 },
        { date: "2025-09-04", value: 130 },
        { date: "2025-09-05", value: 125 },
    ],
};