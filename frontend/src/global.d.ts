// Declaración para permitir la importación de archivos CSS
declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

// Si estás usando una librería externa (como bootstrap)
// para la que no necesitas acceder a los nombres de clase como objeto:
declare module 'bootstrap/dist/css/bootstrap.min.css'; 