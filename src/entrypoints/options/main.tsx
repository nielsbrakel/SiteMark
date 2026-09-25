import React from 'react';
import ReactDOM from 'react-dom/client';
import { browser } from 'wxt/browser';
import '@/styles/base.css';
import './options.css';
import { OptionsApp } from './App';

document.documentElement.lang = browser.i18n.getUILanguage();

const root = document.getElementById('root');
if (!root) throw new Error('[SiteMark] missing #root element');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);
