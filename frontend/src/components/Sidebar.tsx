import React from 'react';

/**
 * Componente Sidebar para navegación y opciones.
 */
const Sidebar = () => {
  return (
    <div className="w-64 bg-[#1F2937] text-white flex flex-col shadow-2xl">
      {/* Logo/Header */}
      <div className="p-4 border-b border-[#374151]">
        <h2 className="text-xl font-bold">TP Final BD</h2>
        <p className="text-sm text-gray-300">Análisis Financiero</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="block px-4 py-2 rounded text-gray-100 hover:bg-[#374151] transition-colors duration-200">
              💬 Chat IA
            </a>
          </li>
          <li>
            <a href="#" className="block px-4 py-2 rounded text-gray-100 hover:bg-[#374151] transition-colors duration-200">
              📊 Dashboards
            </a>
          </li>
          <li>
            <a href="#" className="block px-4 py-2 rounded text-gray-100 hover:bg-[#374151] transition-colors duration-200">
              📄 Reportes
            </a>
          </li>
          <li>
            <a href="#" className="block px-4 py-2 rounded text-gray-100 hover:bg-[#374151] transition-colors duration-200">
              🤖 ML Modelos
            </a>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 text-xs text-gray-500 border-t border-[#374151]">
        <p className="text-gray-400">© 2024 TP Final BD. Versión 1.0</p>
      </div>
    </div>
  );
};

export default Sidebar;