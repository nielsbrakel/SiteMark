import '@/styles/base.css';
import { mount } from '@/ui/mount';
import { GrantApp } from './App';

mount(<GrantApp search={location.search} />);
