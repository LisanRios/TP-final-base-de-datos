# ML

Python

- Modelos de series temporales (ARIMA, Prophet, LSTM, Transformers).
- Procesamiento de embeddings y personalización.
- Generación de reportes PDF/XLSX.

## Asistente de Prueba (Chatbot)

Este proyecto incluye un asistente de prueba basado en IA para testing y demostración.

### Requisitos Previos

- Python 3.7+
- Instalar dependencias: `pip install -r requirements.txt`

### Cómo Ejecutar

1. Navega al directorio `ml`:

   ```bash
   cd ml
   ```

2. Instala las dependencias:

   ```bash
   pip install -r requirements.txt
   ```

3. Ejecuta el asistente:

   ```bash
   streamlit run main.py
   ```

4. Abre tu navegador en `http://localhost:8501` (se abre automáticamente).

### Funcionalidades

- Interfaz web simple para chatear con la IA
- Historial de conversación persistente durante la sesión
- Modelo DeepSeek V3.2 vía API oficial

### Notas de Seguridad

⚠️ **Importante**: Configura siempre la variable de entorno `DEEPSEEK_API_KEY` antes de ejecutar el asistente y evita compartir tu clave pública.
