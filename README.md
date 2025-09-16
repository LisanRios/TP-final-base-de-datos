# TP Final Base de Datos.

# Resumen

*Una pagina web que recibe preguntas de contexto empresarial/financiera y devuelve: series temporales, indicadores técnicos y fundamentales, análisis estadístico y una recomendación generada por IA. El sistema combina ingestión de datos (APIs / scraping), almacenamiento flexible (NoSQL preferido), procesamiento estadístico/ML y una capa de personalización basada en vectores (historial de la conversación / chat).*

# Objetivos

- Entregar respuestas interpretables y accionables sobre instrumentos financieros.
- Soportar datos heterogéneos (acciones, criptos, FX, startups).
- Permitir extensibilidad: nuevos parámetros, nuevas fuentes y nuevos modelos.

# Alcance

- Inputs: consultas en lenguaje natural (ej.: "¿Cuál es la mejor empresa para invertir ahora?").
- Outputs: informe estructurado con datos en tiempo real/históricos, indicadores técnicos, métricas de riesgo, y recomendación con justificación.
- Integraciones previstas: APIs de mercado, web scraping como fallback, motores de embeddings, y (opcional) integración Python + ML (MATE 3 — confirmar con el equipo).

# Flujo de funcionamiento (alto nivel)

1. Recepción del input (chat / query API).
2. Preprocesamiento / vectorización de la consulta (API#1) para detectar intención y entidades.
3. Búsqueda en la BD local (si existe historial/datos ya ingestados).
4. Si faltan datos → pipeline de ingestión: API externa → store / o web scraping → store.
5. Cálculos: estadísticas, indicadores técnicos, modelos de ML/serie temporal.
6. Generación de informe (plantilla + explicación) por API#2 (puede ser un LLM controlador).
7. Personalización: re-rank o adaptar lenguaje según perfil del usuario (vectores / historial).
8. Entrega al usuario y almacenamiento del intercambio para aprendizaje futuro.

# Ejemplo de ejecución (paso a paso)

Input: ¿Cuál es la mejor empresa para invertir **ahora**?

- A) Vectorizamos la pregunta → detectamos: horizonte ("ahora" -> corto plazo), activo: empresa (si no indicada, pedir aclaración o usar top picks).
- B) Consultamos BD: precios, volumen, indicadores técnicos, noticias relevantes.
- C) Si falta info: obtenemos datos externos y los persistimos.
- D) Ejecutamos cálculos (RSI, MACD, medias móviles, volatilidad, VaR simple, correlaciones).
- E) LLM monta el informe (resumen numérico + gráfico + conclusión y nivel de confianza).

# Diseño de almacenamiento

**Recomendación primaria: NoSQL + motor de vectores** (por flexibilidad y velocidad para documento/serie y metadatos).

**Esquema sugerido (NoSQL — “”ORIENTATIVO””):**

- id
- tipo (accion/crypto/fx/startup/etc.)
- fuente (link/s)
- series (timestamp, open, high, low, close, volume)
- indicadores (objeto JSON con RSI, MACD, MA, ATR, etc.)
- pivot_points
- technical_analysis.summary
- metadata (sector, país, ticker, ISIN)
- embeddings (vector para búsqueda semántica)
- ingesta.timestamp
- quality_flags (missing_data, source_reliability)

# Vectorización y personalización

- Mantener un motor de embeddings (FAISS / Milvus / Pinecone) con representaciones de:
    - preguntas dentro de cada chat/conversación (snapshot del contexto)
    - documentos de análisis
    - snapshots de conversaciones relevantes (no perfiles persistentes)
- Importante: los embeddings **se indexan por conversación/chat**, no por perfil de usuario. Cada hilo tendrá su propio historial semántico y contexto, evitando mezclar intereses entre distintas conversaciones.
- Re-rankear respuestas según similitud de embedding entre la **consulta y el estado actual del chat** para adaptar la respuesta al contexto conversacional.

# Generación de reportes y gráficos

- El sistema debe poder generar:
    - Gráficos interactivos y estáticos (series de precio, indicadores, correlaciones).
    - Reportes descargables en PDF y XLSX con tablas, gráficos y notas explicativas.
- Tecnologías sugeridas: matplotlib / plotly para gráficos, pandas / openpyxl / xlsxwriter para XLSX, ReportLab / wkhtmltopdf / WeasyPrint para PDFs.
- Flujo: generar la visualización en el backend, incrustar en el informe, exportar a PDF/XLSX y ofrecer descarga o envío por email.
- Guardar una copia del reporte en la BD (metadatos: versión del modelo, fecha, parámetros usados) para trazabilidad.

# Consideraciones ML / IA

- Modelos de series temporales: ARIMA/Prophet/LSTM/Transformers según horizonte y calidad de datos.
- Modelos explicables y límites claros: siempre proveer la razón y grado de confianza de la recomendación.
- Integración con Python + MATE 3: confirmar compatibilidad, recursos (GPU/CPU), y cómo desplegar (batch vs real‑time).

# Trazabilidad y auditoría

- Mantener ingestion_logs y decision_logs (qué datos usó la IA para cada recomendación).
- Guardar versión de modelo y parámetros usados en cada informe.

# Requerimientos no funcionales

- Latencia objetivo para consulta simple: < 2s (si datos en cache / BD local).
- Jobs ETL diarios/horarios para sincronizar fuentes externas.
- Monitorización de calidad de datos y alertas (missing data, drift).

# Tecnologías sugeridas (orientativo)

- BD NoSQL: MongoDB.
- Vector DB: FAISS / Milvus / Pinecone (a ver).
- Entorno: node.js (react, typescript).
- ML: Python (scikit‑learn, statsmodels, pytorch/TF si hay modelos deep learning).
- Frontend: microservicio REST/GraphQL, dashboard con gráficos (Plotly, Recharts, etc.).
- Deploy: Vercel / firebase / hostinger

# OPCIONALES

- **Entrenar una red neuronal propia**: construir modelos de series temporales (Transformers / LSTM) para predicción interna y no depender completamente de APIs externas.
- **Entrenar/desplegar un modelo de lenguaje propio**: investigar fine‑tuning o entrenamiento desde cero de un LLM para generar informes y respuestas sin depender de servicios externos. Esto requiere datasets, infraestructura y controles de seguridad.
- **Infraestructura propuesta**: cluster de entrenamiento (GPUs/TPUs), sistema de versiones de modelos (MLflow / DVC), pipeline de MLOps para despliegue y monitorización.
- **Pros/Contras**: mayor control y privacidad vs coste y complejidad operativa. Definir roadmap y presupuesto antes de comprometer recursos.

[tablero](https://www.notion.so/263aabf0ff7280dc8217c381c8a95c7b?pvs=21)
