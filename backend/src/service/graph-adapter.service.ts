import { CompanyEntity, HistoricalDataEntry } from "../models/company.types";
import {
    AnalysisDatasets,
    LineDataset,
    CandleDataset,
    VolumeDataset,
    AreaDataset,
    PieDataset,
    ChartType
} from "../models/analysis.types";

import { GraphService } from "./graph.service";

export class GraphAdapterService {

    private graph = new GraphService();

    // Convierte tu data RAW en OHLC real
    private toOHLC(raw: HistoricalDataEntry[]) {
        return raw.map(h => ({
            date: h.rowDate,
            open: Number(h.last_openRaw),
            high: Number(h.last_maxRaw),
            low: Number(h.last_minRaw),
            close: Number(h.last_closeRaw),
            volume: Number(h.volumeRaw),
        }));
    }

    // Crea TODOS los datasets que pide AnalysisEntity
    buildDatasets(company: CompanyEntity): AnalysisDatasets {
        const ohlc = this.toOHLC(company.historicalData);

        // LINE
        const lineGraph = this.graph.generate("line", { historicalData: ohlc });
        const line: LineDataset = {
            dates: lineGraph.data.labels,
            closes: lineGraph.data.values
        };

        // VOLUME
        const volGraph = this.graph.generate("bar", { historicalData: ohlc });
        const volume: VolumeDataset = {
            dates: volGraph.data.labels,
            volume: volGraph.data.values
        };

        // AREA
        const areaGraph = this.graph.generate("area", { historicalData: ohlc });
        const area: AreaDataset = {
            dates: areaGraph.data.labels,
            values: areaGraph.data.values
        };

        // CANDLES
        const candleGraph = this.graph.generate("candlestick", { historicalData: ohlc });
        const candlestick: CandleDataset[] = candleGraph.data;

        // PIE
        const pieGraph = this.graph.generate("pie", { financialData: company.financialData });
        const pie: PieDataset = {
            labels: pieGraph.data.labels,
            values: pieGraph.data.values
        };

        return { line, volume, area, candlestick, pie };
    }

    autoSelectGraph(company: CompanyEntity, datasets: AnalysisDatasets): ChartType {
        const hist = company.historicalData;

        // Si tengo OHLC completo → candlestick
        if (hist.length > 0) {
            const h = hist[0];
            if (h.last_openRaw && h.last_maxRaw && h.last_minRaw) {
                return "candlestick";
            }
        }

        return "line";
    }

    availableGraphs(datasets: AnalysisDatasets): ChartType[] {
        const list: ChartType[] = [];
        if (datasets.line) list.push("line");
        if (datasets.volume) list.push("bar");
        if (datasets.area) list.push("area");
        if (datasets.candlestick) list.push("candlestick");
        if (datasets.pie) list.push("pie");
        return list;
    }
}
