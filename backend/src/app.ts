import express from 'express';
import cors from 'cors';
// Cargar variables de entorno desde backend/.env en desarrollo
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
import * as cheerio from "cheerio";
import { connectToDatabase, closeDatabaseConnection, getDb } from './db';
import { Builder, By, until} from "selenium-webdriver"


const mongo_enabled = true


async function getInvestingData(url: string): Promise<string> {
  //Obtiene el JSON de investing
    const data = await getInvestingHTML(
      url
    ).then(html => {
      const $ = cheerio.load(html);
      const next_data_json = $("#__NEXT_DATA__").text()
      return next_data_json
    })

    return data
}

async function getInvestingHTML(url: string): Promise<string> {
  //Obtiene el JSON de investing
    let driver = await new Builder().forBrowser('chrome').build();
    await driver.get(url);
    await driver.wait(until.elementLocated(By.css('body')), 5000);

    const html = await driver.getPageSource();

    await driver.quit();

    return html
}

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

app.get('/', (req, res) => {
  res.send('API TP Final Base de Datos funcionando');
});

// Ruta paranp chat general
app.post('/api/chat', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Manejar comando especial /analiza {nombre}
  if (query.startsWith('/analiza ')) {
    const nombre = query.slice(9).trim();
    if (!nombre) {
      return res.status(400).json({ error: 'Nombre requerido después de /analiza' });
    }

    try {
      const db = getDb();
      await db.collection('analysis').insertOne({
        name: nombre,
        created_at: new Date()
      });
      return res.json({ response: `Análisis solicitado para ${nombre}. Guardado en la base de datos.` });
    } catch (error) {
      console.error('Error guardando análisis:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
   return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: query
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    const responseText = data.choices[0].message.content;
    res.json({ response: responseText });
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ...aquí irán rutas para consultas, ingestión, reportes, etc.

//Devuelve los datos historicos de la empresa
app.get("/api/scrape/company", async (req, res) => {
  if (!req.query.company) 
    res.status(400).json({ error: 'You forgot to put your company dumbass' })

  try {
    //Extraccion de datos

    //Obtiene el JSON de investing
    const data = await getInvestingData(`https://www.investing.com/equities/${req.query.company}-historical-data`)

    //Filtra la informacion importante
    let historicalData = JSON.parse(data)["props"]["pageProps"]["state"]["historicalDataStore"]["historicalData"]["data"]
    let technicalData = JSON.parse(data)["props"]["pageProps"]["state"]["technicalStore"]["technicalData"]
    let financialData = JSON.parse(data)["props"]["pageProps"]["state"]["financialStatementsStore"]

    //Le saca los colores y datos innecesarios
    historicalData = removeKeyFromArray(historicalData, "direction_color")

    let allData = {
      company: req.query.company,
      historicalData: historicalData,
      technicalData: technicalData,
      financialData: financialData,
      createdAt: new Date()
    }
    
    const allDataJson = JSON.stringify(allData)
    
    /////Envio de datos a la db/////
    if (mongo_enabled) {
      let db = getDb()
      console.log(db.databaseName)

      //Primero ve si la coleccion existe
      const existing = await db.listCollections({ name: "companies" }).toArray();
      if (existing.length === 0) {
        await db.createCollection("companies", { capped: false });
        console.log(`Collection '${"companies"}' created.`);
      }

      //Updatea o si no crea un documento nuevo
      let coll = await db.collection("companies")
      const existingCompany = await coll.findOne({ "company": req.query.company });
      
      if (existingCompany) {
        await coll.updateOne(
          { "company": req.query.company },
          { $set: allData }
        );
      } else {
        await coll.insertOne(allData);
      }

      console.log("Information sent to db sucessfully.")
    }

    res.send(allDataJson)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


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
})

//Este es mas de debugeo, devuelve todo el JSON
app.get("/api/scrape/json", async (req, res) => {
  if (!req.query.company) 
    res.status(400).json({ error: 'You forgot to put your company dumbass' })

  try {
    //Obtiene el JSON de investing
    const data = await getInvestingData(`https://www.investing.com/equities/${req.query.company}-historical-data`)
    res.send(data)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

//Este es mas de debugeo, devuelve todo el html
app.get("/api/scrape/html", async (req, res) => {
  if (!req.query.company) 
    res.status(400).json({ error: 'You forgot to put your company dumbass' })

  try {
    //Obtiene el JSON de investing
    const data = await getInvestingHTML(`https://www.investing.com/equities/${req.query.company}-historical-data`)
    res.send(data)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

const PORT = Number(process.env.PORT) || 3001;

async function startServer() {
  try {
    // Conectar a la base de datos (usa MONGODB_URI en backend/.env)
    if (mongo_enabled)
      await connectToDatabase();

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
