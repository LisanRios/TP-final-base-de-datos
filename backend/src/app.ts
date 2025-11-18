import express from 'express';
import cors from 'cors';
// Cargar variables de entorno desde backend/.env en desarrollo
import dotenv from 'dotenv';
import { HfInference } from "@huggingface/inference";

dotenv.config({ path: '.env' });
import * as cheerio from "cheerio";
import { connectToDatabase, closeDatabaseConnection, getDb } from './db';
import { Builder, By, WebDriver, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// ===========================================
//  👇 1. IMPORTAMOS TUS RUTAS MODULARES
// ===========================================
import chatRoutes from './routes/chat.routes';
import analysisRoutes from './routes/analysis.routes';


// ===========================================
//  (Aquí va todo tu código de scraping, helpers, etc. SIN CAMBIOS)
// ===========================================

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

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: INVESTING_TIMEOUT_MS });

    await page.evaluate(() => {
      const cookieBtn = document.querySelector('#onetrust-accept-btn-handler');
      cookieBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const dialogClose = document.querySelector('div[role="dialog"] button, button[aria-label="Close"]');
      dialogClose?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

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

    return await page.content();
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
    `);
    await waitForNextData(driver, 20000);

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

const hf = new HfInference(process.env.HF_TOKEN);

async function vectorizarTexto(text: string): Promise<number[]> {
  const response = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text,
    pooling: "mean",
    normalize: true
  });

  return response as number[];
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

// ===========================================
//  CONFIGURACIÓN DE EXPRESS
// ===========================================

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API TP Final Base de Datos funcionando');
});


// ===========================================
//  👇 2. USAMOS LAS RUTAS MODULARES
// ===========================================
/*
 * Ahora, cualquier petición a /api/chat (POST) será manejada 
 * por 'chatRoutes', que a su vez llama al 'ChatOrchestrator'.
 * Ya no necesitamos la lógica de /analiza o /estado aquí.
 */
app.use('/api/chat', chatRoutes);

/*
 * Dejamos conectadas las rutas de /api/analysis por si las necesitas
 * (ej. para ver un análisis por ID)
 */
app.use('/api/analysis', analysisRoutes);


// ===========================================
//  👇 3. EL BLOQUE CONFLICTIVO app.post('/api/chat') FUE ELIMINADO
// ===========================================


// ===========================================
//  RUTAS DE SCRAPING (Sin cambios)
// ===========================================

app.get("/api/scrape/company", async (req, res) => {
  if (!req.query.company) 
    res.status(400).json({ error: 'You forgot to put your company dumbass' })

  try {
    // ... (tu código de scraping de compañía)
    //Extraccion de datos
    const data = await getInvestingData(`https://www.investing.com/equities/${req.query.company}-historical-data`)

    //Filtra la informacion importante
    let historicalData = JSON.parse(data)["props"]["pageProps"]["state"]["historicalDataStore"]["historicalData"]["data"]
    let technicalData = JSON.parse(data)["props"]["pageProps"]["state"]["technicalStore"]["technicalData"]
    let financialData = JSON.parse(data)["props"]["pageProps"]["state"]["financialStatementsStore"]

    historicalData = removeKeyFromArray(historicalData, "direction_color")
    
    const historicalWithText: any[] = [];
    for (const day of historicalData) {
      const raw = {
        last_close: safeNum(day.last_closeRaw ?? day.last_close),
        last_open: safeNum(day.last_openRaw ?? day.last_open),
        last_max: safeNum(day.last_maxRaw ?? day.last_max),
        last_min: safeNum(day.last_minRaw ?? day.last_min),
        volume: safeNum(day.volumeRaw ?? day.volume),
        change: safeNum(day.change_percentRaw ?? day.change_percent ?? day.change)
      };

      const text = generarTextoDiario(req.query.company, day.rowDate, raw);
      const vector = await vectorizarTexto(text);
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
    
    if (mongo_enabled) {
      let db = getDb()
      console.log(db.databaseName)
      const existing = await db.listCollections({ name: "companies" }).toArray();
      if (existing.length === 0) {
        await db.createCollection("companies", { capped: false });
        console.log(`Collection '${"companies"}' created.`);
      }
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
    const data = await getInvestingData(`https://www.investing.com/indices/${req.query.index}`)
    res.send(data)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/scrape/json", async (req, res) => {
  if (!req.query.company) 
    res.status(400).json({ error: 'You forgot to put your company dumbass' })

  try {
    const data = await getInvestingData(`https://www.investing.com/equities/${req.query.company}-historical-data`)
    res.send(data)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.get("/api/scrape/html", async (req, res) => {
  if (!req.query.company) 
    res.status(400).json({ error: 'You forgot to put your company dumbass' })

  try {
    const data = await getInvestingHTML(`https://www.investing.com/equities/${req.query.company}-historical-data`)
    res.send(data)
  }
  catch (error){
    console.error('Error doing scraping.', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

// ===========================================
//  INICIO DEL SERVIDOR
// ===========================================

const PORT = Number(process.env.PORT) || 3001;

async function startServer() {
  try {
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
