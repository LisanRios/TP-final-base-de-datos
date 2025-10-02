import React from 'react';
import '../styles/Sidebar.css';

type SidebarProps = {
  isOpen: boolean; // Recibimos si el sidebar está abierto o cerrado
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {isOpen && (
        <>
          {/* Header del sidebar */}
          <div className="sidebar-header">
            <h2>TP Final BD</h2>
            <p className="sidebar-subtitle">Análisis Financiero</p>
          </div>

          {/* Navegación con enlaces */}
          <nav className="sidebar-nav">
            <ul>
              <li>💬 Chat IA</li>
              <li>📊 Dashboards</li>
              <li>📄 Reportes</li>
              <li>🤖 ML Modelos</li>
            </ul>
          </nav>

          {/* Footer del sidebar */}
          <div className="sidebar-footer">
            © 2024 TP Final BD. Versión 1.0
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
