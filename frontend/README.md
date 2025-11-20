# Frontend

React + TypeScript

- Dashboard interactivo con gráficos y reportes.
- Consulta en lenguaje natural.
- Visualización de series temporales, indicadores y recomendaciones.

## Comandos disponibles en el chat

- `/analiza <compañía>`: dispara el scraping de Investing y actualiza la base de datos con el histórico más reciente.
- `/estado <compañía>`: genera el informe cuantitativo, muestra el precio con medias móviles, las velas OHLC más recientes y realiza scraping automático si no hay datos cargados.
- `/graficos <compañía>`: despliega todas las visualizaciones disponibles (precio, velas, retornos, drawdown y volumen), ejecutando scraping automático en caso necesario.
- `/compara <compañía A> y <compañía B>`: compara las métricas cuantitativas recientes de ambas firmas, ejecuta scraping automático si faltan datos y resume el panorama más favorable.
- `/help`: muestra el listado actualizado de comandos soportados.

## Exportar conversaciones

Presiona el botón **“Exportar chat a PDF”** en la cabecera para generar un informe con:

- Resumen de la sesión (fechas, recuento de mensajes, comandos utilizados, gráficos e indicadores generados).
- Todos los mensajes con marcas de tiempo y metadatos.
- Visualizaciones e indicadores tal como aparecen en el chat.

El informe se descarga automáticamente y utiliza un nombre de archivo con sello temporal para facilitar el versionado.
