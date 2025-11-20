// Declaración para permitir la importación de archivos CSS
declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

// Si estás usando una librería externa (como bootstrap)
// para la que no necesitas acceder a los nombres de clase como objeto:
declare module 'bootstrap/dist/css/bootstrap.min.css'; 

declare module 'html2pdf.js' {
    type MarginOption = number | [number, number] | [number, number, number, number];

    export interface Html2PdfOptions {
        margin?: MarginOption;
        filename?: string;
        image?: { type?: 'jpeg' | 'png'; quality?: number };
        html2canvas?: { scale?: number; useCORS?: boolean };
        jsPDF?: { unit?: 'pt' | 'mm' | 'cm' | 'in'; format?: string | number[]; orientation?: 'portrait' | 'landscape' };
        pagebreak?: { mode?: ('css' | 'legacy' | 'avoid-all' | 'css-legacy')[]; before?: string[]; after?: string[]; avoid?: string[] };
    }

    export type Html2PdfInstance = {
        set: (options: Html2PdfOptions) => Html2PdfInstance;
        from: (element: HTMLElement) => Html2PdfInstance;
        toPdf: () => Html2PdfInstance;
        save: () => Promise<void>;
        outputPdf: () => Promise<unknown>;
    };

    function html2pdf(): Html2PdfInstance;
    export default html2pdf;
}