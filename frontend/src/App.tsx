import React from 'react';
import Sidebar from './components/Sidebar.tsx';
import Chat from './components/Chat.tsx';

/**
 * Componente raíz de la aplicación.
 */
function App() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Chat />
      </div>
    </div>
  );
}

export default App;
