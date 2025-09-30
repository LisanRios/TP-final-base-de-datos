import React, { useState, useRef, useEffect } from 'react';
import RenderReport from './RenderReport.tsx';
import TypingIndicator from './TypingIndicator.tsx';
import { fetchFinancialReport } from '../services/geminiApi.ts'; 
import '../styles/Chat.css'; 

// Definición de tipos para el estado 'messages'
type Message = {
    content: string | object; 
    sender: 'user' | 'bot';
    isReport: boolean;
};

/**
 * Componente principal del Chat Financiero que maneja la lógica de mensajes.
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
     * @param {string|object} content Contenido del mensaje.
     * @param {'user'|'bot'} sender Quién envía el mensaje.
     * @param {boolean} isReport Indica si el contenido es un reporte estructurado.
     */
    const addMessage = (content: Message['content'], sender: Message['sender'], isReport = false) => {
        setMessages(prev => [...prev, { content, sender, isReport }]);
    };

    const sendMessage = async () => {
        const textTrimmed = input.trim();
        if (!textTrimmed || isLoading) return;

        // 1. Mostrar mensaje del usuario
        addMessage(textTrimmed, "user");
        setInput("");
        setIsLoading(true);

        try {
            // 2. Llamada simulada al backend/API
            const report = await fetchFinancialReport(textTrimmed);
            
            // 3. Mostrar el reporte estructurado de la IA
            addMessage(report, "bot", true); 

        } catch (error) {
            console.error("Error en la solicitud:", error);
            addMessage("Lo sentimos, ocurrió un error en el motor de análisis. Intenta de nuevo.", "bot", false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !isLoading) sendMessage();
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-900 font-inter">
            <div className="chat-container w-[95vw] max-w-[900px] h-[95vh] flex flex-col bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-indigo-700">
                
                {/* Header */}
                <header className="p-4 bg-gray-700 border-b border-indigo-600 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0h5m-5 0a2 2 0 002 2h2a2 2 0 002-2m-5 0v-6a2 2 0 012-2h2a2 2 0 012 2v6m-2-2h4"></path></svg>
                        Asistente Financiero IA
                    </h1>
                    <span className="text-sm text-gray-400 hidden sm:block">TP Final: Diseño de Interfaz</span>
                </header>

                {/* Historial de Mensajes */}
                <div className="flex-1 p-6 space-y-5 overflow-y-auto chat-messages" ref={chatRef}>
                    {/* Mensaje de bienvenida */}
                    {messages.length === 0 && (
                        <div className="flex justify-start">
                            <div className="p-3 rounded-xl rounded-tl-none bg-indigo-600 text-white max-w-lg shadow-md">
                                <p className="font-semibold">¡Bienvenido! Soy tu Asistente Financiero.</p>
                                <p className="text-sm mt-1">Pregúntame sobre cualquier activo (ej: **Bitcoin**, **acciones de Tesla**). Generaré un informe con análisis técnico, riesgo y una recomendación.</p>
                                <p className="text-xs mt-2 opacity-80">Simulación del pipeline: $\text{2-3}$ segundos de latencia.</p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.isReport && msg.sender === 'bot' ? (
                                <RenderReport report={msg.content} />
                            ) : (
                                <div className={`p-3 rounded-xl shadow-lg max-w-xl ${
                                    msg.sender === 'user' 
                                        ? 'bg-blue-500 text-white rounded-br-none' 
                                        : 'bg-gray-700 text-gray-100 rounded-tl-none'
                                }`}>
                                    {msg.content as string} {/* Casting a string para mensajes de texto */}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {/* Indicador de carga */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-700 p-3 rounded-xl rounded-tl-none shadow-lg">
                                <TypingIndicator />
                            </div>
                        </div>
                    )}
                </div>

                {/* Área de Input */}
                <div className="p-4 border-t border-gray-700 bg-gray-800">
                    <div className="flex space-x-3">
                        <input
                            type="text"
                            id="user-input"
                            placeholder={isLoading ? "Procesando solicitud..." : "Escribe tu consulta financiera..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            className="flex-1 p-3 border border-gray-600 bg-gray-700 text-white rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 transition duration-150"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading || !input.trim()}
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition duration-150 ease-in-out shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '...' : 'Analizar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;