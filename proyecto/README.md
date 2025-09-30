# Proyecto TP Final Base de Datos - Estado Actual y Pendientes

## Descripción General

Este documento resume el estado actual del proyecto "TP Final Base de Datos" y detalla qué falta por implementar, basado en el análisis de los archivos existentes. El proyecto es una plataforma web inteligente para análisis financiero y empresarial, con consultas en lenguaje natural, integración de datos externos, ML y generación de informes. **Nota**: El frontend (React + TypeScript) ya está siendo desarrollado por un amigo, por lo que se ignora en este análisis.

## Estado Actual del Proyecto

- **Backend (Node.js + TypeScript)**: Solo un servidor Express básico con una ruta GET '/'. Falta integración con DB, rutas de API, motor de vectores, etc.
- **ML (Python)**: Un chatbot básico con Streamlit y OpenAI. Falta implementar modelos de series temporales, procesamiento de datos, generación de reportes, etc.
- **Dashboards**: Solo un README. No hay implementación.
- **Reports**: Solo un README. No hay sistema de almacenamiento.
- **Otros**: Configuraciones básicas existen, pero falta integración entre módulos, pruebas y despliegue.

## Qué Falta por Hacer

A continuación, un resumen detallado de las tareas pendientes, dividido por áreas principales. Esto se basa en los objetivos del README principal y el estado de los archivos.

### 1. Backend (Node.js + TypeScript)

- **Instalación de dependencias**: Agregar y configurar paquetes como `express`, `mongoose` (para MongoDB), `cors`, `helmet` (seguridad), y librerías para motor de vectores (ej. `faiss-node` o integración con Pinecone/Milvus). Actualizar `package.json` y ejecutar `npm install`.
- **Integración con base de datos**: Conectar a MongoDB (o similar NoSQL). Crear esquemas para almacenar datos financieros (series temporales, indicadores, embeddings, etc., como se describe en el README). Implementar operaciones CRUD para consultas, ingestión y almacenamiento.
- **Motor de vectores**: Implementar vectorización de consultas y contexto conversacional (usando embeddings para similitud semántica). Integrar con un motor como FAISS o un servicio externo.
- **Rutas de API**: Desarrollar endpoints REST/GraphQL para:
  - Consultas en lenguaje natural (procesar input, vectorizar, buscar en DB).
  - Ingestión de datos (APIs externas como Yahoo Finance, Alpha Vantage, o web scraping con `cheerio` o `puppeteer`).
  - Procesamiento estadístico (cálculos de indicadores técnicos como RSI, MACD, volatilidad).
  - Generación de informes (estructurar respuestas con datos, gráficos y recomendaciones).
  - Personalización por contexto (historial conversacional).
- **Autenticación y seguridad**: Agregar middleware para auth (ej. JWT) si es necesario, y validación de inputs.
- **Pruebas y validación**: Agregar tests unitarios (con Jest) y validar que el servidor compile sin errores (usando `tsc`).
- **Integración con ML**: Endpoints para comunicar con el módulo Python (ej. enviar datos para predicciones y recibir resultados).

### 2. ML (Python)

- **Modelos de ML**: Implementar modelos de series temporales como ARIMA, Prophet, LSTM y Transformers (usando `statsmodels`, `prophet`, `torch`, `tensorflow`). Crear funciones para entrenar y predecir (ej. pronósticos de precios, análisis de riesgo).
- **Procesamiento de datos**: Agregar lógica para procesar embeddings (usando `torch` o `transformers` para vectorización semántica), limpieza de datos (con `pandas`, `numpy`), y análisis estadístico (correlaciones, VaR, etc.).
- **Generación de reportes**: Implementar creación de PDFs/XLSX (usando `reportlab`, `openpyxl`, `xlsxwriter`). Crear plantillas para informes con gráficos (usando `matplotlib`, `plotly`).
- **Integración con backend**: Agregar endpoints o scripts para recibir datos del backend, procesarlos y devolver resultados (ej. predicciones o informes).
- **Chatbot avanzado**: Mejorar el asistente para que integre ML (ej. responder con análisis basados en modelos, no solo chat genérico). Agregar persistencia de conversaciones (usando DB o archivos).
- **Pruebas y validación**: Ejecutar el chatbot (`streamlit run main.py`) y probar modelos con datos de prueba. Agregar logging y manejo de errores.
- **Seguridad**: Mover la API key a variables de entorno (como se menciona en el README) para evitar hardcoding.

### 3. Dashboards

- **Implementación de visualizaciones**: Crear dashboards interactivos (posiblemente con Streamlit, Plotly Dash o integrar con el frontend si es necesario, pero como se ignora, enfocarse en Python). Incluir gráficos para series temporales, indicadores técnicos y resultados de ML.
- **Integración**: Conectar con backend/ML para obtener datos en tiempo real. Agregar filtros y consultas dinámicas.
- **Archivos necesarios**: Crear scripts Python o notebooks para generar gráficos estáticos/interactivos.

### 4. Reports

- **Almacenamiento de reportes**: Crear estructura para guardar PDFs/XLSX generados (ej. carpeta con metadatos en JSON: versión de modelo, fecha, parámetros). Integrar con backend para subir/descargar reportes.
- **Metadatos y versioning**: Agregar lógica para rastrear versiones de informes y asociarlos con consultas.

### 5. Otros Aspectos Generales

- **Integración entre módulos**: Asegurar comunicación entre backend (Node.js), ML (Python) y dashboards/reports. Posiblemente usar APIs REST o sockets.
- **Configuración y despliegue**: Agregar Dockerfiles o scripts para desplegar (ej. en Heroku, AWS). Configurar variables de entorno globales.
- **Pruebas end-to-end**: Una vez implementado, probar el flujo completo (consulta → procesamiento → informe).
- **Documentación**: Actualizar READMEs con instrucciones detalladas, diagramas (usando Mermaid si es necesario) y ejemplos de uso.
- **Dependencias y build**: Verificar que todo compile/ejecute sin errores. Por ejemplo, en backend: `npm run build` y `npm start`. En ML: `pip install -r requirements.txt` y ejecutar scripts.

## Recomendaciones para Priorizar

- **Empieza por el backend**: Es el núcleo (API y DB). Implementa rutas básicas y conexión a DB primero.
- **Luego ML**: Desarrolla modelos y procesamiento, ya que el chatbot actual es solo un placeholder.
- **Dashboards y reports**: Una vez que backend/ML estén listos, integra visualizaciones y almacenamiento.
- **Herramientas útiles**: Usa VS Code para editar. Si necesitas ayuda con código específico, consulta la documentación o pide asistencia.

## Tablero Kanban para Organizar Tareas

Usa este tablero Kanban como template para organizar las tareas. Puedes copiarlo a una herramienta como Trello, GitHub Projects o un archivo Markdown editable. Marca las tareas con `[x]` cuando las completes y muévelas entre columnas.

### To Do (Pendientes)

- [ ] Backend: Instalar dependencias (express, mongoose, etc.)
- [ ] Backend: Conectar a MongoDB y crear esquemas
- [ ] Backend: Implementar motor de vectores (embeddings)
- [ ] Backend: Desarrollar rutas de API (consultas, ingestión, informes)
- [ ] Backend: Agregar autenticación y seguridad
- [ ] Backend: Agregar pruebas unitarias y validación
- [ ] Backend: Integrar con ML (endpoints de comunicación)
- [ ] ML: Implementar modelos de series temporales (ARIMA, Prophet, etc.)
- [ ] ML: Agregar procesamiento de datos y embeddings
- [ ] ML: Implementar generación de reportes (PDF/XLSX)
- [ ] ML: Mejorar chatbot con integración ML
- [ ] ML: Agregar persistencia de conversaciones
- [ ] ML: Mover API key a variables de entorno
- [ ] Dashboards: Crear visualizaciones con Streamlit/Plotly
- [ ] Dashboards: Integrar con backend/ML
- [ ] Reports: Crear sistema de almacenamiento de reportes
- [ ] Reports: Agregar metadatos y versioning
- [ ] General: Integrar módulos (backend + ML + dashboards)
- [ ] General: Configurar despliegue (Docker, etc.)
- [ ] General: Pruebas end-to-end
- [ ] General: Actualizar documentación

### In Progress (En Progreso)

- [ ] (Agrega tareas aquí cuando empieces a trabajar en ellas)

### Done (Completadas)

- [ ] (Agrega tareas aquí cuando las termines)
