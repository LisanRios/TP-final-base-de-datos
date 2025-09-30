import React from 'react';
import Chat from './components/Chat.tsx';

/**
 * Componente raíz de la aplicación.
 */
function App() {
  return (
    // Estilos de Tailwind para la aplicación
    <div className="min-h-screen bg-gray-900">
      <Chat />
    </div>
  );
}

export default App;
