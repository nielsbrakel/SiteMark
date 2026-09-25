import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/styles/base.css';
import './popup.css';
import { PopupApp } from './App';

document.documentElement.lang = browser.i18n.getUILanguage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>,
);
