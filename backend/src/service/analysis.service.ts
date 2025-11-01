import { getDb } from "../db";
import { ObjectId } from "mongodb";
import { mockAnalyses } from "../mocks/analysis.mock";

export interface AnalysisEntity {
    _id?: ObjectId;
    name: string;
    dateCreated: Date;
    summary?: string;
    data?: any;
    indicators?: { name: string; value: number | string }[];
}

export class AnalysisService {
    private collectionName = "analysis";
    private useMock = process.env.USE_MOCK === "true";

    async getAll(): Promise<AnalysisEntity[]> {
        if (this.useMock) return mockAnalyses;
        const db = getDb();
        return db.collection<AnalysisEntity>(this.collectionName).find().toArray();
    }

    async getById(id: string): Promise<AnalysisEntity | null> {
        if (this.useMock) {
            const found = mockAnalyses.find(a => a._id?.toString() === id);
            return found || null;
        }
        const db = getDb();
        return db.collection<AnalysisEntity>(this.collectionName).findOne({ _id: new ObjectId(id) });
    }
}
