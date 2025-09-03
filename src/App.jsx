import React from 'react';
import Game from './pages/Game.jsx';
import './App.css';

function App() {
  return (
    <div className="App">
      <Game currentLevel={1} />
    </div>
  );
}

export default App;

