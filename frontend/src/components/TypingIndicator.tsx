import React from 'react';

/**
 * Componente para renderizar un indicador de carga animado (puntos parpadeantes).
 */
const TypingIndicator = () => (
    <div className="flex items-center space-x-2 p-2">
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></div>
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
        <span className="text-sm italic text-gray-400">Analizando mercado (DB, ML, IA)...</span>
    </div>
);

export default TypingIndicator;
