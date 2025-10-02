import React, { useState, useRef, useEffect } from 'react';
import TypingIndicator from './TypingIndicator.tsx';
import { fetchChatResponse } from '../services/geminiApi.ts'; 
import '../styles/Chat.css'; 

// Definición de tipos para el estado 'messages'
type Message = {
    content: string; 
    sender: 'user' | 'bot';
};

/**
 * Componente principal del Chat que maneja la lógica de mensajes.
 */
const Chat = () => {
    // Tipado explícito: 'Message[]'
    const [messages, setMessages] = useState<Message[]>([]); 
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // Tipado explícito: 'HTMLDivElement' para acceder a scroll properties
    const chatRef = useRef<HTMLDivElement>(null); 
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Ref para el input de texto para poder hacer focus automático
    const inputRef = useRef<HTMLInputElement>(null);

    // Mantiene el scroll abajo al añadir nuevos mensajes
    useEffect(() => {
        const chat = chatRef.current;
        if (!chat) return;

        // Detecta si el usuario está cerca del final
        const isAtBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 50;

        if (isAtBottom && messagesEndRef.current) {
            // Hace scroll hacia el último mensaje
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Auto-focus: después de que isLoading pase a false y haya un nuevo mensaje del bot,
    // enfocamos el input para mejorar la experiencia de usuario.
    useEffect(() => {
        // Si aún está cargando, no movemos el foco
        if (isLoading) return;

        // Obtener el último mensaje
        const last = messages[messages.length - 1];
        if (!last) return;

        // Solo enfocamos si el último mensaje proviene del bot
        if (last.sender === 'bot' && inputRef.current) {
            // Pequeño delay para esperar a que el input esté disponible y cualquier animación termine
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [messages, isLoading]);

    /**
     * Añade un mensaje al historial.
     * @param {string} content Contenido del mensaje.
     * @param {'user'|'bot'} sender Quién envía el mensaje.
     */
    const addMessage = (content: string, sender: 'user' | 'bot') => {
        setMessages(prev => [...prev, { content, sender }]);
    };

    const sendMessage = async () => {
        const textTrimmed = input.trim();
        if (!textTrimmed || isLoading) return;

        // 1. Mostrar mensaje del usuario
        addMessage(textTrimmed, "user");
        setInput("");
        setIsLoading(true);

        try {
            // 2. Llamar a la API (se asume que existe la función y trae un string de respuesta)
            const { response } = await fetchChatResponse(textTrimmed);
            
            // 3. Mostrar la respuesta del bot
            addMessage(response, "bot"); 

        } catch (error) {
            console.error("Error al obtener respuesta de la IA:", error);
            const errorMessage = (error as Error).message;
            
            if (errorMessage === "Consulta fuera de contexto financiero.") {
                addMessage("Disculpa, mi función principal es el **Análisis Financiero**. Por favor, hazme preguntas relacionadas con este tema (inversión, presupuesto, ratios, etc.).", 'bot');
            } else {
                addMessage("Lo siento, hubo un error de conexión inesperado. Inténtalo de nuevo.", 'bot');
            }        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Maneja el envío con la tecla Enter.
     */
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !isLoading) sendMessage();
    };

    return (
        <div className="flex-col min-h-0 bg-[#0F172A] w-full">
            {/* Header minimalista */}
            <header className="p-4 bg-[#1F2937] border-b border-[#374151] text-white shadow-xl z-10">
                <h1 className="text-xl font-semibold">Asistente IA Financiero</h1>
            </header>

            {/* Área de mensajes */}
            <div 
            ref={chatRef} 
            className="chat-messages flex-1 overflow-y-auto p-4 space-y-4" 
            style={{ scrollBehavior: 'smooth' }}
            >
                {/* Mensaje de bienvenida */}
                {messages.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                        <div className="text-center p-6 rounded-xl bg-indigo-600 text-white shadow-2xl max-w-sm">
                            <p className="text-xl font-bold mb-2">¡Hola! Soy tu Asistente Financiero IA.</p>
                            <p className="text-sm">Pregúntame sobre análisis financiero, inversiones, etc.</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`message-wrapper ${msg.sender}`}>
                        <div className="message-bubble">
                            <p>{msg.content}</p>
                        </div>
                    </div>
                ))}

                <div ref={messagesEndRef}></div>

                {/* Indicador de carga */}
                {isLoading && (
                    <div className="message-wrapper bot">
                        <div className="message-bubble typing">
                            <TypingIndicator />
                        </div>
                    </div>
                )}
            </div>

            {/* Área de input fija abajo */}
            <div className="chat-input-wrapper">
                <input
                    type="text"
                    placeholder={isLoading ? "Pensando..." : "Escribe un mensaje..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    ref={inputRef}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                >
                    Enviar
                </button>
            </div>
        </div>
    );
};

export default Chat;