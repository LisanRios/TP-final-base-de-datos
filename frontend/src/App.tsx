import React, { useState } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Chat from './components/Chat.tsx';
import './App.css';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Estado del sidebar

  return (
    <div className="app-container">
      {/* Sidebar dinámico */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Contenedor del chat */}
      <div className="chat-container">
        {/* Botón hamburguesa para abrir/cerrar sidebar */}
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        {/* Componente Chat */}
        <Chat />
      </div>
    </div>
  );
};

export default App;
