import React, { useState, useRef, useEffect } from 'react';
import TypingIndicator from './TypingIndicator.tsx';
import { fetchChatResponse } from '../services/geminiApi.ts';
import ChartWrapper from "./charts/ChartWrapper.tsx";
import { mockLineGraph, mockBarsGraph, mockPieGraph } from "../data/mockData"; 
import '../styles/Chat.css';

type Message = {
    content: string;
    sender: 'user' | 'bot';
    graph_type?: string;
    data?: any;
};

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const chatRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Mantener scroll al final
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    // Auto-focus input después de respuesta del bot
    useEffect(() => {
        if (!isLoading && messages[messages.length - 1]?.sender === 'bot' && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [messages, isLoading]);

    const addMessage = (content: string, sender: 'user' | 'bot', graph_type?: string, data?: any) => {
        setMessages(prev => [...prev, { content, sender, graph_type, data }]);
    };

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        addMessage(trimmed, 'user');
        setInput("");
        setIsLoading(true);

        if (trimmed.toLowerCase() === "/line") {
            addMessage("Gráfico de línea generado 📈", "bot");
            addMessage("", "bot", mockLineGraph.graph_type, mockLineGraph.data);
            setIsLoading(false);
            return;
        }
        
        if (trimmed.toLowerCase() === "/bar") {
            addMessage("Gráfico de barras generado 📊", "bot");
            const barDataForChart = mockBarsGraph.data.map(d => ({ name: d.date, value: d.volume }));
            addMessage("", "bot", mockBarsGraph.graph_type, barDataForChart);
            setIsLoading(false);
            return;
        }
        
        if (trimmed.toLowerCase() === "/pie") {
            addMessage("Gráfico de torta generado 🥧", "bot");
            addMessage("", "bot", mockPieGraph.graph_type, mockPieGraph.data);
            setIsLoading(false);
            return;
        }
        

        try {
            const { response } = await fetchChatResponse(trimmed);

            const parsed = JSON.parse(response);

            if (parsed.graph_type && parsed.data) {
                addMessage(parsed.text || "", 'bot');
                addMessage("", 'bot', parsed.graph_type, parsed.data);
            } else {
                addMessage(response, 'bot');
            }
        } catch (error) {
            console.error(error);
            const msg = (error as Error).message.includes("fuera de contexto")
                ? "Disculpa, mi función principal es el **Análisis Financiero**."
                : "Lo siento, hubo un error de conexión inesperado. Inténtalo de nuevo.";
            addMessage(msg, 'bot');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") sendMessage();
    };

    return (
        <div className="chat-app-container">
            {/* Header */}
            <div className="chat-header">
                Asistente Financiero IA
            </div>

            {/* Área de mensajes */}
            <div ref={chatRef} className="chat-messages">
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <p className="text-xl font-bold mb-2">¡Hola! Soy tu Asistente Financiero IA.</p>
                        <p className="text-sm">Pregúntame sobre análisis financiero, inversiones, etc.</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`message-wrapper ${msg.sender}`}>
                        <div className={`message-bubble ${msg.sender}`}>
                            {msg.content && <p>{msg.content}</p>}

                            {/* Si tiene un gráfico, mostrarlo */}
                            {msg.graph_type && msg.data && (
                                <div className="mt-3">
                                    <ChartWrapper type={msg.graph_type} data={msg.data} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message-wrapper bot">
                        <div className="message-bubble typing">
                            <TypingIndicator />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef}></div>
            </div>

            {/* Input fijo abajo */}
            <div className="chat-input-wrapper">
                <input
                    id='chat-input'
                    name='chat-input'
                    type="text"
                    placeholder={isLoading ? "Pensando..." : "Escribe un mensaje..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    ref={inputRef}
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
