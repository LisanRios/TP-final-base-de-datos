export const normalizeLineData = (data: any[]) => {
    return data.map((item) => {
        const normalized: Record<string, unknown> = {
            date: item.date,
            price: item.price ?? item.value ?? item.amount ?? 0,
        };

        if (typeof item.sma50 === "number") {
            normalized.sma50 = item.sma50;
        }
        if (typeof item.sma200 === "number") {
            normalized.sma200 = item.sma200;
        }

        return normalized;
    });
};

export const normalizeBarData = (data: any[]) => {
    return data.map((item) => ({
        name: item.date ?? item.name ?? "N/A",
        value: item.volume ?? item.value ?? 0,
    }));
};

export const normalizePieData = (data: any[]) => {
    return data.map((item) => ({
        name: item.name ?? item.date ?? item.asset ?? "N/A",
        value: item.value ?? item.amount ?? 0,
    }));
};

export const normalizeCandlestickData = (data: any[]) => {
    return data.map((item, index) => ({
        index,
        date: item.date,
        open: item.open,
        close: item.close,
        high: item.high,
        low: item.low,
    }));
};

export const normalizeAreaData = (data: any[]) => {
    return data.map((item) => ({
        date: item.date,
        value: item.value ?? item.price ?? 0,
    }));
};
