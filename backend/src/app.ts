import express from 'express';
import cors from 'cors';
// Cargar variables de entorno desde backend/.env en desarrollo
import dotenv from 'dotenv';
import * as cheerio from "cheerio";
dotenv.config({ path: '../.env' });


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

app.get("/api/scrape", async (req, res) => {
  try {
    /*
    const response = await fetch('https://www.investing.com/equities/mercadolibre-inc-historical-data', {
      method: 'POST',
      headers: {
        'x-requested-with': `XMLHttpRequest`
      }
    });
    let data = (await response.text()).toString()
    */

    const data = await fetch('https://www.investing.com/equities/mercadolibre-inc-historical-data', {
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
    
    res.send(data)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ...aquí irán rutas para consultas, ingestión, reportes, etc.

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});
