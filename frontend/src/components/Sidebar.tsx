import React from 'react';

/**
 * Componente Sidebar para navegación y opciones.
 */
const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      {/* Logo/Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">TP Final BD</h2>
        <p className="text-sm text-gray-400">Análisis Financiero</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              💬 Chat IA
            </a>
          </li>
          <li>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              📊 Dashboards
            </a>
          </li>
          <li>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              📄 Reportes
            </a>
          </li>
          <li>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              🤖 ML Modelos
            </a>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-400">Versión 1.0</p>
      </div>
    </div>
  );
};

export default Sidebar;