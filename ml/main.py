# main.py
# ML y procesamiento de reportes para TP Final Base de Datos
# Interfaz de chatbot con Streamlit

import streamlit as st
import os
from openai import OpenAI

# Configurar cliente OpenAI
api_key = os.getenv("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")
if not api_key:
    st.error("Por favor, configura la variable de entorno OPENROUTER_API_KEY con tu clave API de OpenRouter.")
    st.stop()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
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
            model="deepseek/deepseek-chat-v3.1:free",
            messages=st.session_state.messages
        )

        response = completion.choices[0].message.content

        # Agregar respuesta de la AI
        st.session_state.messages.append({"role": "assistant", "content": response})

        # Limpiar input y refrescar
        st.rerun()

# Nota de seguridad
st.info("La aplicación usa la variable de entorno OPENROUTER_API_KEY para la autenticación.")
