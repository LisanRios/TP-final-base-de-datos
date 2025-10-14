import express from 'express';
import cors from 'cors';
// Cargar variables de entorno desde backend/.env en desarrollo
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { connectToDatabase, closeDatabaseConnection, getDb } from './db';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API TP Final Base de Datos funcionando');
});

// Ruta para chat general
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

const PORT = Number(process.env.PORT) || 3001;

async function startServer() {
  try {
    // Conectar a la base de datos (usa MONGODB_URI en backend/.env)
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
