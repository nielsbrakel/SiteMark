import '@/styles/base.css';
import { mount } from '@/ui/mount';
import { applyStoredLanguage } from '@/ui/stored-language';
import { OptionsApp } from './App';

void applyStoredLanguage().then(() => mount(<OptionsApp />));
