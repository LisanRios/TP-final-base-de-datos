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

// Nueva función para obtener datos financieros históricos
/**
 * Obtiene datos históricos de precios para un ticker y rango de fechas.
 * @param ticker Símbolo del activo (ej: 'AAPL', 'BTC').
 * @param startDate Fecha de inicio (Date object).
 * @param endDate Fecha de fin (Date object).
 * @returns Array de documentos con datos históricos (debe incluir: date, open, high, low, close, volume).
 */
export async function getHistoricalData(
  ticker: string, 
  startDate: Date, 
  endDate: Date
) {
  try {
    const db = getDb();
    // **Asegúrate de que 'historical_data' sea el nombre de tu colección real.**
    const collection = db.collection('historical_data'); 
    
    
    const data = await collection.find({
      ticker: ticker,
      date: {
        $gte: startDate, 
        $lte: endDate    
      }
    })
    .sort({ date: 1 }) 
    .toArray();

    return data;
  } catch (error) {
    console.error(`Error al obtener datos históricos para ${ticker}:`, error);
    return []; 
  }
}