
# TP Final Base de Datos

## Descripción General

Plataforma web inteligente para análisis financiero y empresarial. Permite consultas en lenguaje natural y genera informes estructurados con series temporales, indicadores técnicos y fundamentales, análisis estadístico y recomendaciones basadas en IA. Integra ingestión de datos (APIs/web scraping), almacenamiento flexible (NoSQL), procesamiento estadístico/ML y personalización por contexto conversacional.

## Objetivos

- Proveer respuestas interpretables y accionables sobre instrumentos financieros.
- Soportar datos heterogéneos: acciones, criptomonedas, divisas (FX), startups, entre otros.
- Facilitar la extensibilidad para incorporar nuevos parámetros, fuentes y modelos.

## Alcance

- **Entradas:** Consultas en lenguaje natural (ejemplo: “¿Cuál es la mejor empresa para invertir ahora?”).
- **Salidas:** Informes estructurados con datos en tiempo real e históricos, indicadores técnicos, métricas de riesgo y recomendaciones justificadas.
- **Integraciones:** APIs de mercado, web scraping como respaldo, motores de embeddings y (opcional) integración con Python + ML.

## Flujo de Funcionamiento

1. Recepción de la consulta (chat o API).
2. Preprocesamiento y vectorización para detectar intención y entidades.
3. Búsqueda en la base de datos local (si existe historial o datos previos).
4. Ingesta de datos externos en caso de ser necesario (API/web scraping).
5. Cálculo de estadísticas, indicadores técnicos y modelos de ML/series temporales.
6. Generación del informe mediante plantilla y explicación (posible uso de LLM).
7. Personalización de la respuesta según el contexto conversacional.
8. Entrega al usuario y almacenamiento del intercambio para aprendizaje futuro.

## Ejemplo de Ejecución

**Consulta:** ¿Cuál es la mejor empresa para invertir ahora?

- Vectorización de la pregunta para identificar horizonte temporal y tipo de activo.
- Consulta a la base de datos: precios, volumen, indicadores técnicos, noticias relevantes.
- Ingesta de datos externos si la información es insuficiente.
- Ejecución de cálculos: RSI, MACD, medias móviles, volatilidad, VaR, correlaciones.
- Generación de informe con resumen numérico, gráfico, conclusión y nivel de confianza.

## Diseño de Almacenamiento

**Recomendación:** Base de datos NoSQL + motor de vectores para flexibilidad y velocidad.

**Esquema sugerido:**
- id
- tipo (acción, cripto, FX, startup, etc.)
- fuente (enlaces)
- series (timestamp, open, high, low, close, volume)
- indicadores (RSI, MACD, MA, ATR, etc.)
- pivot_points
- technical_analysis.summary
- metadata (sector, país, ticker, ISIN)
- embeddings (vector semántico)
- ingesta.timestamp
- quality_flags (datos faltantes, confiabilidad de fuente)

## Vectorización y Personalización

- Motor de embeddings (FAISS, Milvus, Pinecone) para:
    - Consultas y contexto conversacional.
    - Documentos de análisis.
    - Historial semántico por conversación.
- Las respuestas se re-ranquean según la similitud de embeddings entre la consulta y el estado actual del chat.

## Generación de Reportes y Gráficos

- Gráficos interactivos y estáticos (series de precios, indicadores, correlaciones).
- Reportes descargables en PDF y XLSX con tablas, gráficos y notas explicativas.
- Tecnologías recomendadas: matplotlib, plotly, pandas, openpyxl, xlsxwriter, ReportLab, wkhtmltopdf, WeasyPrint.
- Flujo: generación en backend, incrustación en informe, exportación y almacenamiento para trazabilidad.

## Consideraciones de ML/IA

- Modelos de series temporales: ARIMA, Prophet, LSTM, Transformers según horizonte y calidad de datos.
- Modelos explicables: siempre incluir justificación y grado de confianza.
- Integración con Python + MATE 3: confirmar compatibilidad y recursos disponibles.

## Trazabilidad y Auditoría

- Mantener ingestion_logs y decision_logs para registrar datos utilizados en cada recomendación.
- Guardar versión de modelo y parámetros en cada informe.

## Requerimientos No Funcionales

- Latencia objetivo para consultas simples: < 2 segundos (con datos en caché/BD local).
- Jobs ETL periódicos para sincronización de fuentes externas.
- Monitorización de calidad de datos y alertas (datos faltantes, drift).

## Tecnologías Sugeridas

- Base de datos NoSQL: MongoDB.
- Vector DB: FAISS, Milvus, Pinecone.
- Backend: Node.js (TypeScript).
- ML: Python (scikit-learn, statsmodels, PyTorch, TensorFlow).
- Frontend: Microservicio REST/GraphQL, dashboard con gráficos (Plotly, Recharts).
- Deploy: Vercel, Firebase, Hostinger.

## Opcionales

- Entrenamiento de modelos propios de series temporales (Transformers/LSTM).
- Fine-tuning o entrenamiento de LLM para generación de informes y respuestas.
- Infraestructura: cluster de entrenamiento (GPU/TPU), versionado de modelos (MLflow/DVC), pipeline de MLOps.
- Evaluar pros/contras: mayor control y privacidad vs coste y complejidad operativa.

[tablero](https://www.notion.so/263aabf0ff7280dc8217c381c8a95c7b?pvs=21)
