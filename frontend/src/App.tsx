import React from 'react';
import Sidebar from './components/Sidebar.tsx';
import Chat from './components/Chat.tsx';

/**
 * Componente raíz de la aplicación.
 */
function App() {
  return (
    <div className="flex h-screen bg-transparent">
      <Sidebar />
      <div className="flex-1 flex justify-center"> 
        <div className="flex-1 flex flex-col max-w-4xl"> 
            <Chat />
        </div>
      </div>
    </div>
  );
}

export default App;
