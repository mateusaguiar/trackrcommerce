import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import './index.css';

/**
 * Ponto de entrada que renderiza o componente App no elemento #root do index.html
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);