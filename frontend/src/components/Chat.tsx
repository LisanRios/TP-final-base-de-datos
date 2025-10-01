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

    // Mantiene el scroll abajo al añadir nuevos mensajes
    useEffect(() => {
        if (chatRef.current) {
            // TypeScript ahora sabe que chatRef.current es un HTMLDivElement
            chatRef.current.scrollTop = chatRef.current.scrollHeight; 
        }
    }, [messages]);

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
            // 2. Llamada al backend
            const { response } = await fetchChatResponse(textTrimmed);
            
            // 3. Mostrar la respuesta de la IA
            addMessage(response, "bot"); 

        } catch (error) {
            console.error("Error en la solicitud:", error);
            addMessage("Lo sentimos, ocurrió un error. Intenta de nuevo.", "bot");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !isLoading) sendMessage();
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            {/* Header minimalista */}
            <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-center">
                <h1 className="text-lg font-semibold text-gray-800">Asistente Financiero IA</h1>
            </header>

            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatRef}>
                {/* Mensaje de bienvenida */}
                {messages.length === 0 && (
                    <div className="flex justify-center">
                        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs text-center">
                            <p className="font-medium">¡Hola! Soy tu Asistente Financiero IA.</p>
                            <p className="text-sm mt-1">Pregúntame sobre análisis financiero, inversiones, etc.</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md`}>
                            {msg.sender === 'bot' && (
                                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    AI
                                </div>
                            )}
                            <div className={`px-4 py-2 rounded-2xl ${
                                msg.sender === 'user'
                                    ? 'bg-blue-500 text-white rounded-br-md'
                                    : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                            }`}>
                                <p className="text-sm">{msg.content}</p>
                            </div>
                            {msg.sender === 'user' && (
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    Tú
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Indicador de carga */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-end space-x-2">
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                AI
                            </div>
                            <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-md shadow-sm">
                                <TypingIndicator />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Área de input fija abajo */}
            <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        placeholder={isLoading ? "Pensando..." : "Escribe un mensaje..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;