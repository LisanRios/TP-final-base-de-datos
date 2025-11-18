import { getDb } from "../db";
import { CompanyEntity } from "../models/company.types";
import { normalizeTerm } from "../utils/string.utils";
import { ObjectId } from "mongodb";

export class CompanyService {
    private col = "companies";

    async findBySlug(slug: string): Promise<CompanyEntity | null> {
        const db = getDb();
        return db.collection<CompanyEntity>(this.col).findOne({ company: slug });
    }

    /*
        Búsqueda por término libre: "clarin", "grupo clarin", "GGAL", etc.
        Busca coincidencias dentro del campo `company` que es el slug.
     */
    async searchByTerm(term: string): Promise<CompanyEntity | null> {
        const db = getDb();
        const normalized = normalizeTerm(term);

        const regex = new RegExp(normalized.split(/\s+/).join(".*"), "i");

        return db
            .collection<CompanyEntity>(this.col)
            .findOne({ company: { $regex: regex } });
    }

    async getById(id: string): Promise<CompanyEntity | null> {
        const db = getDb();
        if (!ObjectId.isValid(id)) return null;

        return db
            .collection<CompanyEntity>(this.col)
            .findOne({ _id: new ObjectId(id) });
    }
}
