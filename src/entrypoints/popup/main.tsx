import '@/styles/base.css';
import './popup.css';
import { mount } from '@/ui/mount';
import { applyStoredLanguage } from '@/ui/stored-language';
import { PopupApp } from './App';

void applyStoredLanguage().then(() => mount(<PopupApp />));
