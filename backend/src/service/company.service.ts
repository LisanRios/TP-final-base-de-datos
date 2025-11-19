import { getDb } from "../db";
import { CompanyEntity } from "../models/company.types";
import { normalizeTerm } from "../utils/string.utils";
import { ObjectId } from "mongodb";

export class CompanyService {
    private col = "companies";

    async findCompanyFromQuery(query: string) {
        const db = getDb();
        const words = query
            .toLowerCase()
            .replace(/[^a-z0-9áéíóúüñ ]/gi, " ")
            .split(" ")
            .filter(w => w.length > 2);
    
        return db.collection(this.col).findOne({
            $or: words.map(w => ({
                $or: [
                    { company: new RegExp(w, "i") },
                    { name: new RegExp(w, "i") },
                    { aliases: new RegExp(w, "i") }
                ]
            }))
        });
    }    

    async findBySlug(slug: string): Promise<CompanyEntity | null> {
        const db = getDb();
        const normalized = normalizeTerm(slug);
        return db.collection<CompanyEntity>(this.col).findOne({
            $or: [
                { company: normalized },
                { company: { $regex: normalized.replace(/-/g, ".*"), $options: 'i' } }
            ]
        });
    }

    /*
    Búsqueda por término libre: "clarin", "grupo clarin", "GGAL", etc.
    Busca coincidencias dentro del campo `company` que es el slug.
    */
    async searchByTerm(term: string): Promise<CompanyEntity | null> {
        const db = getDb();
        const normalized = normalizeTerm(term);
        const words = normalized.split(/\s+/).filter(Boolean);
    
        // Crear regex que busque todas las palabras en cualquier orden
        const regex = words.map(w => `(?=.*${w})`).join('') + '.*';
    
        const company = await db.collection<CompanyEntity>("companies")
            .findOne({ company: { $regex: regex, $options: 'i' } });
    
        return company;
    }
        

    async getById(id: string): Promise<CompanyEntity | null> {
        const db = getDb();
        if (!ObjectId.isValid(id)) return null;

        return db
            .collection<CompanyEntity>(this.col)
            .findOne({ _id: id });
    }
}
