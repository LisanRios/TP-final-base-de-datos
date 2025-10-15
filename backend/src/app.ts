import express from 'express';
import cors from 'cors';
// Cargar variables de entorno desde backend/.env en desarrollo
import dotenv from 'dotenv';
import * as cheerio from "cheerio";
dotenv.config({ path: '../.env' });

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
app.get("/api/scrape/historical", async (req, res) => {
  if (!req.query.company) 
    res.status(400).json({ error: 'You forgot to put your company dumbass' })

  try {
    //Obtiene el JSON de investing
    const data = await getInvestingData(`https://www.investing.com/equities/${req.query.company}-historical-data`)

    //Filtra la informacion importante
    const historicalData = JSON.parse(data)["props"]["pageProps"]["state"]["historicalDataStore"]["historicalData"]["data"]
    const historicalDataJson = JSON.stringify(historicalData)
    
    res.send(historicalDataJson)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/scrape/technical", async (req, res) => {
  if (!req.query.company) 
    res.status(400).json({ error: 'You forgot to put your company dumbass' })

  try {
    //Obtiene el JSON de investing
    const data = await getInvestingData(`https://www.investing.com/equities/${req.query.company}-historical-data`)

    //Filtra la informacion importante
    const technicalData = JSON.parse(data)["props"]["pageProps"]["state"]["technicalStore"]["technicalData"]
    const technicalDataJson = JSON.stringify(technicalData)
    
    res.send(technicalDataJson)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});
