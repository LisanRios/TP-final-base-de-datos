import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';

interface ExportChatButtonProps {
  elementId: string;
  fileName?: string;
  disabled?: boolean;
  onBeforeExport?: () => void;
  onAfterExport?: () => void;
  onError?: (error: unknown) => void;
}

const ExportChatButton: React.FC<ExportChatButtonProps> = ({
  elementId,
  fileName = 'Reporte_Analisis_Financiero.pdf',
  disabled = false,
  onBeforeExport,
  onAfterExport,
  onError
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportToPDF = async () => {
    if (disabled || isGenerating) return;

    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Error: No se encontró ningún elemento con el ID: ${elementId}`);
      alert('Error: No se pudo encontrar el contenido del chat para exportar.');
      return;
    }

    const options = {
      margin: 12,
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.report-section'] }
    };

    try {
      setIsGenerating(true);
      onBeforeExport?.();
      await new Promise(resolve => setTimeout(resolve, 60));
      await (html2pdf() as any).set(options).from(element).save();
    } catch (error) {
      console.error('No se pudo generar el PDF del chat.', error);
      onError?.(error);
      alert('Ocurrió un error al generar el informe en PDF. Intenta nuevamente.');
    } finally {
      onAfterExport?.();
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleExportToPDF}
      disabled={disabled || isGenerating}
      style={{
        padding: '10px 15px',
        backgroundColor: disabled ? '#94a3b8' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: disabled || isGenerating ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span role="img" aria-hidden="true">📄</span>
      {isGenerating ? 'Generando informe…' : 'Exportar chat a PDF'}
    </button>
  );
};

export default ExportChatButton;