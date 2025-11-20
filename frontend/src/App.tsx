import Chat from './components/Chat.tsx';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app-container">
      {/* Contenedor del chat */}
      <div className="chat-container">
        {/* Componente Chat */}
        <Chat />
      </div>
    </div>
  );
};

export default App;
