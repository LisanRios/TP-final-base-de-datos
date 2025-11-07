import React from 'react';
import html2pdf from 'html2pdf.js'


interface ExportChatButtonProps {

  elementId: string;
  fileName?: string;
}


const ExportChatButton: React.FC<ExportChatButtonProps> = ({ 
  elementId, 
  fileName = 'Reporte_Analisis_Financiero.pdf' 
}) => {

 
  const handleExportToPDF = () => {
   
    const element = document.getElementById(elementId);

    if (!element) {
      console.error(`Error: No se encontró ningún elemento con el ID: ${elementId}`);
      alert('Error: No se pudo encontrar el contenido del chat para exportar.');
      return;
    }

 
    const options = {
      margin: 10,                 
      filename: fileName,         
      image: { type: 'jpeg' as const, quality: 0.98 }, 
      html2canvas: { scale: 2 },  
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };


    html2pdf()
      .set(options as any)
      .from(element)
      .save();
  };

  return (
    <button 
      onClick={handleExportToPDF} 
      style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
    >
      📄 Exportar Chat a PDF
    </button>
  );
};

export default ExportChatButton;