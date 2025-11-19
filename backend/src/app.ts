import express from 'express';
import cors from 'cors';
// Cargar variables de entorno desde backend/.env en desarrollo
import dotenv from 'dotenv';
import { HfInference } from "@huggingface/inference";

// .env de backend 
// MONGODB_URI=mongodb+srv://root:7ZtssvZFbL5EZrAo@clustertest1.vf2aggf.mongodb.net/?retryWrites=true&w=majority&appName=ClusterTest1
// PORT=3001
// DEEPSEEK_API_KEY=sk-517272b0cd1d4d75beee6cbfe034ae1d


dotenv.config({ path: '.env' });
import * as cheerio from "cheerio";
import { connectToDatabase, closeDatabaseConnection, getDb } from './db';
import { generateEstadoReport } from './analysis';
import type { CompanyDocument } from './analysis';
import { Builder, By, WebDriver, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const BASE_INVESTING_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://www.investing.com/'
};

function safeNum(x: any) {
  return typeof x === "number" ? x : Number(x ?? 0);
}

const INVESTING_TIMEOUT_MS = 20000;
const INVESTING_COOKIE = process.env.INVESTING_COOKIE ?? '';
const ENABLE_SELENIUM_FALLBACK = process.env.SCRAPER_ENABLE_SELENIUM === 'true';
const MODEL = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat';
const DEEPSEEK_API_BASE_URL = (process.env.DEEPSEEK_API_BASE_URL?.trim() || 'https://api.deepseek.com/v1').replace(/\/$/, '');
const DEEPSEEK_CHAT_COMPLETIONS_URL = `${DEEPSEEK_API_BASE_URL}/chat/completions`;

puppeteer.use(StealthPlugin());


const mongo_enabled = true

function normalizarFecha(query: string) {
  const meses: Record<string, number> = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12
  };

  const regex =
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;

  const match = query.match(regex);
  if (!match) return null;

  const day = match[1];
  const month = meses[match[2].toLowerCase()];

  // si querés manejar el año, vos decidís:
  const year = new Date().getFullYear();

  return `${year}-${month.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
}


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
  const errors: Array<{ label: string; error: unknown }> = [];

  try {
    console.info('Extrayendo HTML de Investing con Puppeteer...');
    return await fetchInvestingHTMLViaPuppeteer(url);
  } catch (puppeteerError) {
    errors.push({ label: 'puppeteer', error: puppeteerError });
    console.warn('Puppeteer falló, evaluando fallback Selenium...', puppeteerError);
  }

  if (ENABLE_SELENIUM_FALLBACK) {
    try {
      return await fetchInvestingHTMLViaSelenium(url);
    } catch (seleniumError) {
      errors.push({ label: 'selenium', error: seleniumError });
      console.error('El fallback Selenium falló.', seleniumError);
    }
  } else {
    console.warn('Selenium deshabilitado vía SCRAPER_ENABLE_SELENIUM.');
  }

  const lastAttempt = errors.length ? errors[errors.length - 1] : undefined;
  const lastError = lastAttempt?.error as Error | undefined;
  throw new Error(`No se pudo obtener HTML de Investing. Último error (${lastAttempt?.label ?? 'sin intentos'}): ${lastError?.message ?? 'sin detalle'}`);
}

async function fetchInvestingHTMLViaPuppeteer(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(BASE_INVESTING_HEADERS['User-Agent']);
    await page.setExtraHTTPHeaders({
      'Accept-Language': BASE_INVESTING_HEADERS['Accept-Language'],
      'Cache-Control': BASE_INVESTING_HEADERS['Cache-Control'],
      'Pragma': BASE_INVESTING_HEADERS['Pragma'],
      'Referer': BASE_INVESTING_HEADERS['Referer'],
      ...(INVESTING_COOKIE ? { Cookie: INVESTING_COOKIE } : {})
    });

    // Ir a la página
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: INVESTING_TIMEOUT_MS });

    // Cerrar pop-ups y cookies
    await page.evaluate(() => {
      const cookieBtn = document.querySelector('#onetrust-accept-btn-handler');
      cookieBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const dialogClose = document.querySelector('div[role="dialog"] button, button[aria-label="Close"]');
      dialogClose?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Espera explícita hasta que aparezca el JSON
    let nextData: string | null = null;
    const start = Date.now();
    while (!nextData && Date.now() - start < INVESTING_TIMEOUT_MS) {
      nextData = await page.evaluate(() => {
        const script = document.querySelector('#__NEXT_DATA__');
        return script ? script.textContent : null;
      });
      if (!nextData) await new Promise(r => setTimeout(r, 500));

    }

    if (!nextData) throw new Error('No se pudo encontrar __NEXT_DATA__ en la página');

    return await page.content(); // Devuelve el HTML completo
  } finally {
    await browser.close();
  }
}

async function fetchInvestingHTMLViaSelenium(url: string): Promise<string> {
  const options = new chrome.Options();
  options.addArguments(
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--window-size=1920,1080',
    '--disable-blink-features=AutomationControlled',
    `--user-agent=${BASE_INVESTING_HEADERS['User-Agent']}`,
    '--lang=es-ES'
  );
  options.excludeSwitches('enable-automation');
  options.excludeSwitches('enable-logging');
  options.setUserPreferences({
    'profile.default_content_setting_values.notifications': 2,
    'intl.accept_languages': 'es-ES,es'
  });

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get(url);
    await driver.wait(until.elementLocated(By.css('body')), 5000);

    await driver.executeScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.navigator.chrome = window.navigator.chrome || { runtime: {} };
      window.navigator.permissions && window.navigator.permissions.query && window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : window.navigator.permissions.query(parameters)
      );
    `);
    await waitForNextData(driver, 20000);

    // Cierra overlays intrusivos que bloquean la carga del cuerpo
    await driver.executeScript(`
      const dialogClose = document.querySelector('div[role="dialog"] button, button[aria-label="Close"]');
      if (dialogClose) {
        dialogClose.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      const cookieBtn = document.querySelector('#onetrust-accept-btn-handler');
      if (cookieBtn) {
        cookieBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    `);

    const html = await driver.getPageSource();
    if (!html.includes('__NEXT_DATA__')) {
      throw new Error('Selenium no pudo capturar el payload esperado');
    }
    return html;
  } finally {
    await driver.quit();
  }
}

const HF_TOKEN = process.env.HF_TOKEN?.trim();
let hfClient = HF_TOKEN ? new HfInference(HF_TOKEN) : null;
let hasLoggedEmbeddingFallback = false;

function fallbackVectorizarTexto(text: string, dimensions = 128): number[] {
  const clean = text ?? "";
  const vector = new Array(dimensions).fill(0);

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const idx = code % dimensions;
    vector[idx] += ((code % 31) + 1) / 32;
  }

  const norm = Math.sqrt(vector.reduce((acc, value) => acc + value * value, 0));
  if (norm === 0) {
    return vector;
  }

  return vector.map(value => value / norm);
}

function toNumberArray(data: unknown): number[] | null {
  if (Array.isArray(data) && data.every(value => typeof value === "number")) {
    return data as number[];
  }

  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(data)) {
    return Array.from(data as unknown as Iterable<number>);
  }

  return null;
}

async function vectorizarTexto(text: string): Promise<number[]> {
  const input = text?.toString() ?? "";

  if (hfClient) {
    try {
      const response = await hfClient.featureExtraction({
        model: MODEL,
        inputs: input,
        pooling: "mean",
        normalize: true
      });

      if (Array.isArray(response)) {
        const flattened = Array.isArray(response[0])
          ? toNumberArray(response[0])
          : toNumberArray(response);

        if (flattened) {
          return flattened;
        }
      } else {
        const flattened = toNumberArray(response);
        if (flattened) {
          return flattened;
        }
      }

      throw new Error("Unexpected embedding response shape");
    } catch (error) {
      console.error("Fallo al vectorizar con HuggingFace, se utilizará el método local:", error);
      hfClient = null;
    }
  }

  if (!hasLoggedEmbeddingFallback) {
    if (!HF_TOKEN) {
      console.warn("HF_TOKEN no está configurado. Usando vectorización local como respaldo.");
    } else {
      console.warn("Fallo la vectorización con HuggingFace. Usando vectorización local como respaldo.");
    }
    hasLoggedEmbeddingFallback = true;
  }

  return fallbackVectorizarTexto(input);
}

function generarTextoDiario(company: any, date: any, raw: any): string {
  return `El día ${date} la acción ${company} abrió en ${raw.last_open}, ` +
         `alcanzó un máximo de ${raw.last_max}, un mínimo de ${raw.last_min} ` +
         `y cerró en ${raw.last_close}. El volumen operado fue ${raw.volume} ` +
         `y la variación diaria fue ${raw.change}%.`;
}

async function waitForNextData(driver: WebDriver, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = await driver.executeScript('return !!document.querySelector("#__NEXT_DATA__")');
    if (found) return;
    await driver.sleep(500);
  }
  throw new Error('El script de Next.js no apareció tras esperar 20s (posible bloqueo por login).');
}

function removeKeyFromArray<T extends Record<string, any>>(
  arr: T[],
  key: string
): Array<Record<string, any>> {
  return arr.map(obj =>
    Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key))
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API TP Final Base de Datos funcionando');
});

function sanitizeModelOutput(text: string): string {
  return text
    .replace(/<\｜begin▁of▁sentence｜>/g, '')
    .replace(/<\|begin_of_text\|>/g, '')
    .replace(/<\|end_of_text\|>/g, '')
    .trim();
}


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

  if (query.toLowerCase().startsWith('/estado')) {

  const apiKey = process.env.DEEPSEEK_API_KEY;

  console.log("\n=========================");
  console.log(">>> ENTRÓ A /estado");
  console.log("=========================\n");

  console.log(">>> QUERY RAW:", JSON.stringify(query));
  console.log(">>> QUERY LOWER:", query.toLowerCase());

  // =======================
  // 1) NORMALIZACIÓN FECHA
  // =======================
  const dateNormalized = normalizarFecha(query);
  console.log(">>> Fecha normalizada:", dateNormalized);

  let queryProcesada = query;
  if (dateNormalized) {
    queryProcesada = query + ` (fecha normalizada: ${dateNormalized})`;
    console.log(">>> Query procesada:", queryProcesada);
  }

  try {
    console.log("\n--- 1) Conectando a DB ---");
    const db = getDb();

    const companies = await db.collection("companies").find().toArray();

    console.log(">>> Empresas en DB:", companies.map(c => c.company));
    const names = companies.map(c => c.company.toLowerCase());
    console.log(">>> Nombres normalizados:", names);

    const empresa = names.find(n => query.toLowerCase().includes(n));
    console.log(">>> Empresa detectada:", empresa);

    if (!empresa) {
      console.log("❌ No se detectó empresa en la query");
      return res.status(400).json({ error: "No pude detectar la empresa en la query." });
    }

    console.log("\n--- 2) Buscando documento de empresa ---");
    const companyDoc = companies.find(c => c.company.toLowerCase() === empresa);
    console.log(">>> Documento empresa encontrado:", !!companyDoc);

    if (!companyDoc) {
      console.log("❌ No existe companyDoc para", empresa);
      return res.status(404).json({ error: `No se encontraron datos para la empresa ${empresa}` });
    }

    console.log("\n--- 3) Vectorizando query ---");
    console.log(">>> Texto enviado a vectorizar:", queryProcesada);

    // vectorizamos la query normalizada
    const queryVector = await vectorizarTexto(queryProcesada);

    console.log(">>> Vector query (primeros 5 valores):", queryVector.slice(0, 5));
    console.log(">>> Largo del vector de query:", queryVector.length);

    console.log("\n--- 4) Buscando día más parecido ---");

    // --- 4) Buscar día (primero exacto por fecha, si no → embeddings) ---
  const historicalData = companyDoc.historicalData;
  console.log(">>> Cantidad de días en DB:", historicalData.length);

  // 1) Normalizamos fecha desde la query (usa tu función normalizarFecha)
  const normalized = normalizarFecha(query); // devuelve 'YYYY-MM-DD' o null
  console.log(">>> Fecha normalizada:", normalized);

  // helper: convierte diferentes formatos de day.date -> 'YYYY-MM-DD'
  function dateToISO(d: any): string | null {
    if (d == null) return null;

    // number (posible timestamp en segundos o ms)
    if (typeof d === "number") {
      // detectar si es segundos (10 dígitos) o ms (13 dígitos)
      const ts = d < 1e12 ? d * 1000 : d;
      const dt = new Date(ts);
      if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
      return null;
    }

    // string: puede ser '2025-11-14', 'Nov 14, 2025', '14 Nov 2025', etc.
    if (typeof d === "string") {
      // Si ya es 'YYYY-MM-DD'
      const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(d.trim());
      if (isoMatch) return d.trim();

      // Intentar parsear con Date
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

      // intentar parsear cadenas tipo 'Nov 14, 2025' reemplazando coma
      const parsed2 = new Date(d.replace(/,/g, ''));
      if (!isNaN(parsed2.getTime())) return parsed2.toISOString().slice(0, 10);
    }

    return null;
  }

  // 1st: buscar match exacto por fecha normalizada
  let bestMatch = null;
  let bestScore = -Infinity;

  if (normalized) {
    console.log(">>> Intentando match exacto por fecha (ISO)...");
    bestMatch = historicalData.find((day: any) => {
      const dayIso = dateToISO(day.date);
      return dayIso === normalized;
    });

    if (bestMatch) {
      console.log(">>> Match exacto encontrado (por fecha):", dateToISO(bestMatch.date));
    } else {
      console.log(">>> No se encontró match exacto por fecha.");

    }
      }
  // 2nd: fallback embeddings (si no hubo match exacto)
  if (!bestMatch) {
    // generar vector de la query (ya lo tenés arriba; si no, vectorizar aquí)
    const queryVector = await vectorizarTexto(query);
    console.log(">>> Vector query (primeros 5):", queryVector.slice(0,5));

    function cosineSim(a: number[], b: number[]): number {
      if (!a || !b || a.length !== b.length) return -1;
      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      if (normA === 0 || normB === 0) return -1;
      return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    let index = 0;
    for (const day of historicalData) {
      // skip si no hay vector guardado
      if (!day.vector || !Array.isArray(day.vector)) {
        console.log(`>>> Día #${index} (${day.date}) sin vector; saltando.`);
        index++;
        continue;
      }
      const score = cosineSim(queryVector, day.vector);
      console.log(`>>> Día #${index} (${dateToISO(day.date) ?? day.date}) → score:`, score);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = day;
      }
      index++;
    }

    console.log(">>> Mejor score por embeddings:", bestScore);
  }

  if (!bestMatch) {
    console.log("❌ No se encontró ningún match (ni exacto ni por embeddings).");
    return res.status(404).json({ error: "No se encontró un día similar a la query" });
  }

  console.log("\n>>> BEST MATCH RESULT:");
  console.log("· Día (ISO):", dateToISO(bestMatch.date));
  console.log("· Día raw:", bestMatch.date);
  console.log("· Texto:", bestMatch.text);

      if (!bestMatch) {
        console.log("❌ No se encontró ningún día similar.");
        return res.status(404).json({ error: "No se encontró un día similar a la query" });
      }

      console.log("\n--- 5) Llamando al modelo ---");
      
      console.log(">>> API KEY cargada:", !!apiKey);

      const bodyPayload = {
        model: MODEL,
        messages: [
          {
            role: "user",
            content:
              `Contexto recuperado de la base:\n` +
              `Empresa: ${empresa}\n` +
              `Día detectado: ${bestMatch.date}\n` +
              `Datos del día:\n${bestMatch.text}\n\n`
          },
          {
            role: "user",
            content: queryProcesada
          }
        ],
      };

      console.log(">>> Payload enviado:", JSON.stringify(bodyPayload, null, 2));

      const response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      console.log(">>> RESPUESTA DEL MODELO:", data);

      return res.json({ response: data.choices[0].message.content });

    } catch (err) {
      console.error("\n❌ ERROR en bloque /estado:", err, "\n");
      return res.status(500).json({ error: "Error interno al procesar la query" });
    }
  }
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
    }

    try {
      const response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
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
      const cleanResponse = sanitizeModelOutput(responseText);
      res.json({ response: cleanResponse });
    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
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
      // Vectorizamos uno por uno (sin romper orden)
  const historicalWithText: any[] = [];
  for (const day of historicalData) {
    const raw = {
    last_close: safeNum(day.last_closeRaw ?? day.last_close),
    last_open: safeNum(day.last_openRaw ?? day.last_open),
    last_max: safeNum(day.last_maxRaw ?? day.last_max),
    last_min: safeNum(day.last_minRaw ?? day.last_min),
    volume: safeNum(day.volumeRaw ?? day.volume),
    change: safeNum(day.change_percentRaw ?? day.change_percent ?? day.change) // OJO
  };

    const text = generarTextoDiario(req.query.company, day.rowDate, raw);

    const vector = await vectorizarTexto(text); // ✅ AQUÍ SE GENERA EL EMBEDDING

    const normalizedDate = new Date(day.rowDate).toISOString().split("T")[0];

    historicalWithText.push({
      date: normalizedDate,
      raw,
      text,
      vector
    });
  }

      let allData = {
        company: req.query.company,
        historicalData: historicalWithText,
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

  app.get('/api/estado', async (req, res) => {
    const rawCompany = Array.isArray(req.query.company) ? req.query.company[0] : req.query.company;
    const companyParam = typeof rawCompany === 'string' ? rawCompany.trim() : '';

    if (!companyParam) {
      return res.status(400).json({ error: 'Parámetro "company" obligatorio' });
    }

    if (!mongo_enabled) {
      return res.status(503).json({ error: 'La base de datos no está habilitada en este entorno' });
    }

    try {
      const db = getDb();
      const collection = db.collection('companies');

      let companyDoc = await collection.findOne({ company: companyParam });

      if (!companyDoc) {
        const regex = new RegExp(`^${escapeRegExp(companyParam)}$`, 'i');
        companyDoc = await collection.findOne({ company: regex });
      }

      if (!companyDoc) {
        const slug = companyParam.toLowerCase().replace(/\s+/g, '-');
        companyDoc = await collection.findOne({ company: slug });
      }

      if (!companyDoc) {
        return res.status(404).json({ error: `No se encontraron datos para ${companyParam}` });
      }

      const { _id, ...rest } = companyDoc as CompanyDocument & { _id?: unknown };
      const typedDoc: CompanyDocument = {
        company: rest.company,
        historicalData: Array.isArray(rest.historicalData) ? rest.historicalData : [],
        technicalData: rest.technicalData,
        createdAt: rest.createdAt
      };

      const report = generateEstadoReport(typedDoc);

      const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
      let aiAnalysis: {
        past: string;
        present: string;
        future: string;
        conclusion: string;
      } | null = null;

      if (!apiKey) {
        console.warn('DEEPSEEK_API_KEY no configurada; se omite análisis narrativo en /api/estado.');
      } else {
        try {
          const messages = [
            {
              role: 'system',
              content:
                'Eres un analista financiero sénior. Recibirás un informe cuantitativo de una empresa y debes evaluarla separando tu respuesta en cuatro campos: pasado (historial y confiabilidad), presente (situación actual), futuro (proyección de valor y estabilidad) y conclusion (recomendación sintética). Usa lenguaje claro en español neutro y evita repetir textualmente el resumen original. Cada campo debe ser un párrafo conciso.'
            },
            {
              role: 'user',
              content: `Informe cuantitativo:

${report.summaryText}

Métricas JSON:
${JSON.stringify(report.metrics, null, 2)}`
            }
          ];

          const response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: MODEL,
              messages,
              temperature: 0.3,
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'EstadoNarrativo',
                  schema: {
                    type: 'object',
                    properties: {
                      past: { type: 'string' },
                      present: { type: 'string' },
                      future: { type: 'string' },
                      conclusion: { type: 'string' }
                    },
                    required: ['past', 'present', 'future', 'conclusion'],
                    additionalProperties: false
                  }
                }
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();

            if (response.status === 429) {
              let rateLimitMessage = 'Se alcanzó el límite diario gratuito del modelo de análisis narrativo.';
              try {
                const parsedError = JSON.parse(errorText);
                const providerMessage = parsedError?.error?.message;
                if (typeof providerMessage === 'string') {
                  rateLimitMessage = providerMessage;
                }
              } catch (parseError) {
                // No es JSON válido, usamos el mensaje por defecto
              }

              console.warn(`[DeepSeek] ${rateLimitMessage} Se devolverá el informe cuantitativo sin análisis narrativo enriquecido.`);

              const guidance = 'Puedes intentarlo nuevamente más tarde o aumentar el plan de DeepSeek para restablecer el acceso.';
              aiAnalysis = {
                past: 'Análisis narrativo no disponible temporalmente porque se alcanzó el límite de uso del modelo. Consulta la sección cuantitativa para revisar el desempeño histórico.',
                present: 'No se generó la interpretación automática del estado actual debido al límite del modelo. Revisa las métricas numéricas para el contexto inmediato.',
                future: 'No se elaboró una proyección narrativa porque el modelo alcanzó su límite gratuito. Considera volver a intentarlo cuando el cupo diario se renueve.',
                conclusion: `${rateLimitMessage} ${guidance}`
              };
            } else {
              throw new Error(`Respuesta ${response.status}: ${errorText}`);
            }
          } else {
            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            if (typeof content === 'string') {
              const clean = sanitizeModelOutput(content);
              try {
                const parsed = JSON.parse(clean);
                if (
                  parsed &&
                  typeof parsed === 'object' &&
                  typeof parsed.past === 'string' &&
                  typeof parsed.present === 'string' &&
                  typeof parsed.future === 'string' &&
                  typeof parsed.conclusion === 'string'
                ) {
                  aiAnalysis = parsed;
                } else {
                  console.warn('El modelo devolvió un JSON con formato inesperado en /api/estado.');
                }
              } catch (jsonError) {
                console.warn('No se pudo parsear la respuesta del modelo en /api/estado:', jsonError);
              }
            }
          }
        } catch (modelError) {
          console.error('Error solicitando análisis narrativo en /api/estado:', modelError);
        }
      }

      return res.json({
        ...report,
        aiAnalysis
      });
    } catch (error) {
      console.error('Error generando estado:', error);
      return res.status(500).json({ error: 'Error interno al generar el estado' });
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
