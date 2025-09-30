import React from 'react';

/**
 * Componente principal para renderizar el informe estructurado de la IA.
 * * @param {object} props
 * @param {object} props.report El objeto de informe financiero.
 */
const RenderReport = ({ report }) => {
    // Definición de estilos para la recomendación
    let recStyle = { color: 'text-gray-400', bg: 'bg-gray-700', icon: '❓' };
    if (report.recommendation === 'COMPRA') {
        recStyle = { color: 'text-emerald-400', bg: 'bg-emerald-800/50', icon: '🟢' };
    } else if (report.recommendation === 'VENTA') {
        recStyle = { color: 'text-red-400', bg: 'bg-red-800/50', icon: '🔴' };
    } else if (report.recommendation === 'MANTENER') {
        recStyle = { color: 'text-yellow-400', bg: 'bg-yellow-800/50', icon: '🟡' };
    }

    return (
        <div className="bg-gray-800 p-4 rounded-xl border-t-4 border-indigo-500 shadow-xl max-w-full">
            <h2 className="text-2xl font-bold mb-3 text-indigo-300 border-b border-gray-700 pb-2">
                {report.asset} - Informe de Análisis
            </h2>

            {/* Recomendación */}
            <div className={`p-3 rounded-lg ${recStyle.bg} flex items-center justify-between mb-4`}>
                <div className="flex items-center space-x-3">
                    <span className="text-3xl">{recStyle.icon}</span>
                    <span className={`text-xl font-extrabold ${recStyle.color}`}>
                        RECOMENDACIÓN: {report.recommendation}
                    </span>
                </div>
                <span className="text-sm text-gray-300">
                    Confianza (Simulada): {report.confidence}%
                </span>
            </div>

            {/* Resumen y Datos Clave */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-200">1. Resumen y Serie Temporal</h3>
                <p className="text-gray-400 italic mt-1">{report.summary}</p>
            </div>

            {/* Métricas clave */}
            <div className="grid grid-cols-3 gap-4 mb-4 border-b border-gray-700 pb-3">
                <div className="p-2 bg-gray-700 rounded-md">
                    <span className="text-sm font-medium text-indigo-400 block">Precio Actual</span>
                    <span className="text-lg font-bold text-white">{report.keyMetrics.price}</span>
                </div>
                <div className="p-2 bg-gray-700 rounded-md">
                    <span className="text-sm font-medium text-indigo-400 block">Volatilidad (Riesgo)</span>
                    <span className="text-lg font-bold text-white">{report.keyMetrics.volatility}</span>
                </div>
                <div className="p-2 bg-gray-700 rounded-md">
                    <span className="text-sm font-medium text-indigo-400 block">RSI (Indicador Téc.)</span>
                    <span className="text-lg font-bold text-white">{report.keyMetrics.rsi}</span>
                </div>
            </div>

            {/* Justificación */}
            <div>
                <h3 className="text-lg font-semibold text-gray-200">2. Justificación (IA Explicable)</h3>
                <p className="text-gray-400 mt-1">{report.justification}</p>
            </div>
            
            {/* Pie de página de trazabilidad simulada */}
            <p className="mt-4 text-xs text-gray-500 pt-2 border-t border-gray-800">
                *Trazabilidad: Datos de Ingesta: {new Date().toLocaleDateString()}, Modelo Usado: LLM v3.1, Parámetros: Corto Plazo.
            </p>
        </div>
    );
};

export default RenderReport;
