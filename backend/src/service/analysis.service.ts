import { getDb } from "../db";
import { ObjectId } from "mongodb";

import { CompanyEntity } from "../models/company.types";
import {
    AnalysisEntity,
    AnalysisIndicators,
    AnalysisDatasets,
    ChartType
} from "../models/analysis.types";

import { CompanyService } from "./company.service";
import { GraphService } from "./graph.service";

export class AnalysisService {
    private col = "analysis";
    private graphSvc = new GraphService();
    private companySvc = new CompanyService();

    async getById(id: string): Promise<AnalysisEntity | null> {
        const db = getDb();
        if (!ObjectId.isValid(id)) return null;

        return db
            .collection<AnalysisEntity>(this.col)
            .findOne({ _id: new ObjectId(id) });
    }

    async getLatestForCompany(companyId: string): Promise<AnalysisEntity | null> {
        const db = getDb();
        const collection = db.collection<AnalysisEntity>(this.col);

        return collection
            .find({ companyId: new ObjectId(companyId) })
            .sort({ generatedAt: -1 })
            .limit(1)
            .next();
    }

    /*
        Construye un AnalysisEntity completo a partir del CompanyEntity.
     */
    private buildIndicators(company: CompanyEntity): AnalysisIndicators {
        const hist = company.historicalData;
        if (!hist || hist.length < 2) {
            return {
                rsi: 0,
                macd: 0,
                adx: 0,
                volatility: 0,
                trend: "neutral"
            };
        }

        const first = Number(hist[0].last_closeRaw);
        const last = Number(hist[hist.length - 1].last_closeRaw);

        const variationPct = ((last - first) / first) * 100;
        const trend = variationPct > 0 ? "alcista" : variationPct < 0 ? "bajista" : "neutral";

        const volValues = hist.map(h => Number(h.change_precentRaw)).filter(v => !isNaN(v));
        const volatility = volValues.length ? Math.max(...volValues) - Math.min(...volValues) : 0;

        return {
            rsi: 50,              // placeholder hasta cálculo real
            macd: 0,              // placeholder
            adx: 20,              // placeholder
            volatility,
            trend
        };
    }

    /*
        Genera y guarda un análisis completo.
     */
    async generateAndSave(company: CompanyEntity, query: string, forcedGraph?: ChartType) {
        const db = getDb();
        const col = db.collection<AnalysisEntity>(this.col);

        // Indicadores financieros
        const indicators = this.buildIndicators(company);

        // Datasets para gráficos
        const datasets = this.graphSvc.buildDatasets(company);

        // Determinar gráfico default
        const defaultGraph: ChartType =
            forcedGraph ??
            this.graphSvc.autoSelectGraph(company, datasets);

        const summary =
            `${company.company} tiene una tendencia ${indicators.trend} ` +
            `y una volatilidad de ${indicators.volatility.toFixed(2)}%.`;

        const analysis: AnalysisEntity = {
            company: company.company,
            companyId: company._id.toString(),
            generatedAt: new Date(),
            summary,
            charts: {
                default: defaultGraph,
                available: this.graphSvc.availableGraphs(datasets)
            },
            datasets,
            indicators
        };

        const res = await col.insertOne(analysis);
        analysis._id = res.insertedId.toString();

        return analysis;
    }

    /*
        Genera un gráfico adicional y lo agrega a un analysis ya existente.
     */
    async generateGraphForAnalysis(analysisId: string, graph: ChartType) {
        const existing = await this.getById(analysisId);
        if (!existing) throw new Error("Analysis not found");

        const company = await this.companySvc.findBySlug(existing.company);
        if (!company) throw new Error("Company not found");

        const datasets = this.graphSvc.buildDatasets(company);

        existing.charts.available.push(graph);
        existing.datasets = datasets;
        existing.generatedAt = new Date();

        const db = getDb();
        await db.collection<AnalysisEntity>(this.col).updateOne(
            { _id: new ObjectId(analysisId) },
            { $set: existing }
        );

        return existing;
    }
}
