import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import * as cheerio from "cheerio";
import chatRoutes from './routes/chat.routes';
import analysisRoutes from './routes/analysis.routes';
import { connectToDatabase, closeDatabaseConnection } from './db';

function removeKeyFromArray<T extends Record<string, any>>(
  arr: T[],
  key: string
): Array<Record<string, any>> {
  return arr.map(obj =>
    Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key))
  );
}


const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('API TP Final Base de Datos funcionando');
});

// Rutas del chat
app.use('/api/chat', chatRoutes);

// Rutas de los análisis
app.use('/api/analysis', analysisRoutes);

// Funciones de scraping

//test
async function getInvestingData(url: string): Promise<string> {
  //Obtiene el JSON de investing
    const data = await fetch(url, {
      method: 'POST',
      headers: {
        'x-requested-with': `XMLHttpRequest`
      }
    }).then(response => {
      return response.text()
    }).then(html => {
      const $ = cheerio.load(html);
      const next_data_json = $("#__NEXT_DATA__").text()
      return next_data_json
    })

    return data
}

app.get("/api/scrape/historical", async (req, res) => {
  if (!req.query.company) return res.status(400).json({ error: 'Falta company' });

  try {
    //Obtiene el JSON de investing
    const data = await getInvestingData(`https://www.investing.com/equities/${req.query.company}-historical-data`)

    //Filtra la informacion importante
    let historicalData = JSON.parse(data)["props"]["pageProps"]["state"]["historicalDataStore"]["historicalData"]["data"]
    let technicalData = JSON.parse(data)["props"]["pageProps"]["state"]["technicalStore"]["technicalData"]
    let financialData = JSON.parse(data)["props"]["pageProps"]["state"]["financialStatementsStore"]

    //Le saca los colores y datos innecesarios
    historicalData = removeKeyFromArray(historicalData, "direction_color")
    

    let allData = {
      "historical": historicalData,
      "technicalData": technicalData,
      "financialData": financialData
    }
    
    const allDataJson = JSON.stringify(allData)
    
    res.send(allDataJson)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//Este es mas de debugeo, devuelve todo el JSON
app.get("/api/scrape/json", async (req, res) => {
  if (!req.query.company) 
    res.status(400).json({ error: 'You forgot to put your company dumbass' })

  try {
    //Obtiene el JSON de investing
    const data = await getInvestingData(`https://www.investing.com/equities/${req.query.company}-financial-summary`)
    res.send(data)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.get("/api/scrape/indexes", async (req, res) => {
  try {
    if (!req.query.index)
      res.status(400).json({ error: "No pusiste el indice" })

    //Obtiene el JSON de investing
    const data = await getInvestingData(`https://www.investing.com/indices/${req.query.index}`)
    res.send(data)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = Number(process.env.PORT) || 3001;

async function startServer() {
  try {
    // Conectar a la base de datos (usa MONGODB_URI en backend/.env)
    //await connectToDatabase();

    app.listen(PORT, () => {
      console.log(`Backend escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Error iniciando servidor:', err);
    process.exit(1);
  }
}

startServer();

// Manejar cierre gracioso
/*
process.on('SIGINT', async () => {
  console.log('Recibido SIGINT, cerrando...');
  await closeDatabaseConnection();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log('Recibido SIGTERM, cerrando...');
  await closeDatabaseConnection();
  process.exit(0);
});
*/
