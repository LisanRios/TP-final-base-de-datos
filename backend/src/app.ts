import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import * as cheerio from "cheerio";
import chatRoutes from './routes/chat.routes';
import { connectToDatabase, closeDatabaseConnection } from './db';

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('API TP Final Base de Datos funcionando');
});

// Rutas del chat
app.use('/api/chat', chatRoutes);

// Funciones de scraping
async function getInvestingData(url: string): Promise<string> {
  const data = await fetch(url, {
    method: 'POST',
    headers: { 'x-requested-with': `XMLHttpRequest` }
  }).then(r => r.text())
    .then(html => {
      const $ = cheerio.load(html);
      return $("#__NEXT_DATA__").text();
    });
  return data;
}

app.get("/api/scrape/historical", async (req, res) => {
  if (!req.query.company) return res.status(400).json({ error: 'Falta company' });

  try {
    const data = await getInvestingData(`https://www.investing.com/equities/${req.query.company}-historical-data`);
    const historicalData = JSON.parse(data)["props"]["pageProps"]["state"]["historicalDataStore"]["historicalData"]["data"];
    res.json(historicalData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/scrape/technical", async (req, res) => {
  if (!req.query.company) return res.status(400).json({ error: 'Falta company' });

  try {
    const data = await getInvestingData(`https://www.investing.com/equities/${req.query.company}-historical-data`);
    const technicalData = JSON.parse(data)["props"]["pageProps"]["state"]["technicalStore"]["technicalData"];
    res.json(technicalData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = Number(ENV.PORT) || 3001;

async function startServer() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));
  } catch (err) {
    console.error('Error iniciando servidor:', err);
    process.exit(1);
  }
}

// Manejo de cierre
process.on('SIGINT', async () => { await closeDatabaseConnection(); process.exit(0); });
process.on('SIGTERM', async () => { await closeDatabaseConnection(); process.exit(0); });

startServer();
