import React, { useState, useRef, useEffect } from 'react';
import TypingIndicator from './TypingIndicator.tsx';
import FinancialIndicatorsCard from "./FinancialIndicatorsCard.tsx";
import ChartWrapper from "./charts/ChartWrapper.tsx";
import { chatService } from '../services/chatService.ts';
import { graphService } from '../services/graphService.ts';
import { mockService } from "../services/mockService.ts";
import '../styles/Chat.css';

export type Message = {
    content: string;
    sender: 'user' | 'bot';
    graph_type?: string;
    data?: any;
    indicators?: { name: string; value: number | string }[];
};

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const chatRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    useEffect(() => {
        if (!isLoading && messages[messages.length - 1]?.sender === 'bot' && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [messages, isLoading]);

    const addMessage = (
        content: string, 
        sender: 'user' | 'bot', 
        graph_type?: string, 
        data?: any, 
        indicators?: { name: string; value: number | string }[]
    ) => {
        setMessages(prev => [...prev, { content, sender, graph_type, data, indicators }]);
    };

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        addMessage(trimmed, 'user');
        setInput("");
        setIsLoading(true);

        // Comando de prueba
        if (trimmed.toLowerCase() === "/test-indicators") {
            const messages = mockService.getTestIndicators();
            messages.forEach(msg => addMessage(msg.content, msg.sender, msg.graph_type, msg.data, msg.indicators));
            setIsLoading(false);
            return;
        }

        // Comando de gráfico
        const graph = graphService.getMockGraph(trimmed);
        if (graph) {
            addMessage(`Gráfico ${graph.graph_type} generado 📊`, 'bot');
            addMessage("", 'bot', graph.graph_type, graph.data);
            setIsLoading(false);
            return;
        }

        // Consulta al backend
        try {
            const { response } = await chatService.sendMessage(trimmed);
            const parsed = JSON.parse(response);
        
            if (parsed.graph_type && parsed.data) {
                addMessage(parsed.text || "", 'bot');
                
                addMessage(
                    "", 
                    'bot', 
                    parsed.graph_type, 
                    parsed.data, 
                    parsed.indicators
                );
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
            <div className="chat-header">
                Asistente Financiero IA
            </div>

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

                            {msg.graph_type && msg.data && (
                                <div className="mt-3">
                                    <ChartWrapper type={msg.graph_type} data={msg.data} />
                                    {/* Si el mensaje incluye indicadores financieros */}
                                    {msg.indicators && msg.indicators.length > 0 && (
                                        <FinancialIndicatorsCard indicators={msg.indicators} />
                                    )}
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
