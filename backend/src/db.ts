import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const uri = process.env.MONGODB_URI as string | undefined;
if (!uri) {
  throw new Error('MONGODB_URI no está configurada en backend/.env');
}

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectToDatabase(dbName?: string) {
  if (dbInstance) return dbInstance;

  // uri está garantizada por la comprobación anterior
  client = new MongoClient(uri as string, { serverApi: { version: '1' as any } });
  await client.connect();

  dbInstance = dbName ? client.db(dbName) : client.db();
  console.log('Conectado a MongoDB');
  return dbInstance;
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    console.log('Conexión a MongoDB cerrada');
  }
}

export function getDb() {
  if (!dbInstance) throw new Error('La base de datos no está conectada. Llama a connectToDatabase primero.');
  return dbInstance;
}
