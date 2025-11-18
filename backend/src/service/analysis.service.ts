import { getDb } from "../db";
import { ObjectId } from "mongodb";

import { CompanyEntity } from "../models/company.types";
import {
    AnalysisEntity,
    AnalysisIndicators,
    ChartType
} from "../models/analysis.types";

import { CompanyService } from "./company.service";
import { GraphAdapterService } from "./graph-adapter.service";

export class AnalysisService {
    private col = "analysis";
    private graphs = new GraphAdapterService();
    private companySvc = new CompanyService();

    async getAll(): Promise<AnalysisEntity[]> {
        const db = getDb();
        return db.collection<AnalysisEntity>(this.col)
            .find()
            .sort({ generatedAt: -1 })
            .toArray();
    }

    async getById(id: string): Promise<AnalysisEntity | null> {
        const db = getDb();
        if (!ObjectId.isValid(id)) return null;

        return db
            .collection<AnalysisEntity>(this.col)
            .findOne({ _id: id })
    }

    async getLatestForCompany(companyId: string): Promise<AnalysisEntity | null> {
        const db = getDb();
        const collection = db.collection<AnalysisEntity>(this.col);

        return collection
            .find({ companyId })
            .sort({ generatedAt: -1 })
            .limit(1)
            .next();
    }

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

        const volValues = hist
            .map(h => Number(h.change_precentRaw))
            .filter(v => !isNaN(v));

        const volatility = volValues.length
            ? Math.max(...volValues) - Math.min(...volValues)
            : 0;

        return {
            rsi: 50,     // placeholders hasta implementar
            macd: 0,
            adx: 20,
            volatility,
            trend
        };
    }

    async getOrCreateAnalysisForCompany(slug: string, forcedGraph?: ChartType) {
        // 1) buscar company en mongo
        const company = await this.companySvc.findBySlug(slug);
        if (!company) {
            throw new Error(`Company '${slug}' not found`);
        }

        // 2) buscar análisis más nuevo
        const existing = await this.getLatestForCompany(company._id.toString());
        if (existing) {
            return existing;
        }

        // 3) si no existe → generarlo
        return this.generateAndSave(company, "auto", forcedGraph);
    }

    async generateAndSave(company: CompanyEntity, query: string, forcedGraph?: ChartType) {
        const db = getDb();
        const col = db.collection<AnalysisEntity>(this.col);

        // 1) Indicadores
        const indicators = this.buildIndicators(company);

        // 2) Datasets
        const datasets = this.graphs.buildDatasets(company);

        // 3) Gráfico default según datos
        const defaultGraph: ChartType =
            forcedGraph ??
            this.graphs.autoSelectGraph(company, datasets);

        // 4) Resumen básico
        const summary =
            `${company.company} tiene una tendencia ${indicators.trend} ` +
            `y una volatilidad de ${indicators.volatility.toFixed(2)}%.`;

        // 5) Crear entity
        const analysis: AnalysisEntity = {
            company: company.company,
            companyId: company._id.toString(),
            generatedAt: new Date(),
            summary,
            charts: {
                default: defaultGraph,
                available: this.graphs.availableGraphs(datasets)
            },
            datasets,
            indicators
        };

        const res = await col.insertOne(analysis);
        analysis._id = res.insertedId.toString();

        return analysis;
    }

    async generateGraphForAnalysis(analysisId: string, graph: ChartType) {
        const existing = await this.getById(analysisId);
        if (!existing) throw new Error("Analysis not found");

        const company = await this.companySvc.findBySlug(existing.company);
        if (!company) throw new Error("Company not found");

        const datasets = this.graphs.buildDatasets(company);

        existing.charts.available.push(graph);
        existing.datasets = datasets;
        existing.generatedAt = new Date();

        const db = getDb();
        await db.collection<AnalysisEntity>(this.col).updateOne(
            { _id: analysisId },
            { $set: existing }
        );

        return existing;
    }
}
