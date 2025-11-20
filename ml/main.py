# main.py
# ML y procesamiento de reportes para TP Final Base de Datos
# Interfaz de chatbot con Streamlit

import streamlit as st
import os
from openai import OpenAI

# Configurar cliente para DeepSeek (compatible con OpenAI SDK)
# La API key NO debe estar hardcodeada en el código. Lee la clave desde la variable de entorno
# DEEPSEEK_API_KEY. Para desarrollo en Windows PowerShell:
#   $env:DEEPSEEK_API_KEY = "sk-REPLACE_WITH_YOUR_KEY"
# Para una sesión persistente usa un archivo .env (no commitearlo) o configura el entorno del servicio.
api_key = os.getenv("DEEPSEEK_API_KEY")
if not api_key:
    st.error("Por favor, configura la variable de entorno DEEPSEEK_API_KEY con tu clave API de DeepSeek.")
    st.stop()

client = OpenAI(
    base_url=os.getenv("DEEPSEEK_API_BASE_URL", "https://api.deepseek.com/v1"),
    api_key=api_key,
)

# Inicializar mensajes en session_state si no existe
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "system", "content": "You are a helpful assistant."}
    ]

# Título de la app
st.title("Chatbot TP Final Base de Datos")

# Mostrar historial de mensajes
for message in st.session_state.messages[1:]:  # Omitir el system message
    if message["role"] == "user":
        st.write(f"**You:** {message['content']}")
    elif message["role"] == "assistant":
        st.write(f"**AI:** {message['content']}")

# Input del usuario
user_input = st.text_input("Escribe tu mensaje:", key="user_input")

# Botón para enviar
if st.button("Enviar"):
    if user_input:
        # Agregar mensaje del usuario
        st.session_state.messages.append({"role": "user", "content": user_input})

        # Obtener respuesta de la AI
        completion = client.chat.completions.create(
            model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
            messages=st.session_state.messages
        )

        response = completion.choices[0].message.content

        # Agregar respuesta de la AI
        st.session_state.messages.append({"role": "assistant", "content": response})

        # Limpiar input y refrescar
        st.rerun()

# Nota de seguridad
st.info("La aplicación usa la variable de entorno DEEPSEEK_API_KEY para la autenticación.")
