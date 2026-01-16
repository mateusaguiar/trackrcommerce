import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoot from './app-root.jsx';
import './index.css';

/**
 * Ponto de entrada que renderiza o componente App no elemento #root do index.html
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);