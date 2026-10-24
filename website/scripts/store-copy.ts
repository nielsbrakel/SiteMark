// The words on the store images, per language (store/listing.md lists the headlines).
import type { Locale } from '../src/i18n/locales';
import type { Head } from './store-art';

export type Copy = {
  production: { head: Head; sub: string; ribbon: string; button: string };
  environments: { head: Head; sub: string };
  popup: { head: Head; sub: string; click: string };
  picker: { head: Head; sub: string; save: string };
  options: { head: Head; sub: string; presets: string; preview: string };
  privacy: { head: Head; sub: string; checks: string[] };
};

export const COPY: Record<Locale, Copy> = {
  en: {
    production: {
      head: ['Never mistake ', 'production', ' for test'],
      sub: 'Ribbon, banner and frame on the sites you choose',
      ribbon: 'Always labelled',
      button: 'The risky button,\noutlined',
    },
    environments: {
      head: ['Every environment ', 'its own colour', ''],
      sub: 'Production, staging and test never look the same',
    },
    popup: {
      head: ['Mark a site ', 'in one click', ''],
      sub: 'Access for that one site only. Collects no data.',
      click: 'One click',
    },
    picker: {
      head: ['Protect ', 'the button that matters', ''],
      sub: 'Pick any element and give it its own mark',
      save: 'Saved for every visit',
    },
    options: {
      head: ['Fine-tune every mark, ', 'see it live', ''],
      sub: 'Colour, ribbon, banner, frame, tint, title prefix',
      presets: 'Preset colours, colour-blind safe',
      preview: 'Live preview',
    },
    privacy: {
      head: ['Private ', 'by design', ''],
      sub: 'No data collected. No access until you add a site.',
      checks: [
        'No accounts, analytics or servers',
        'Access per site, only when you ask',
        'Settings stay in your browser',
      ],
    },
  },
  nl: {
    production: {
      head: ['Verwar ', 'productie', ' nooit meer met test'],
      sub: 'Lint, banner en kader op de sites die jij kiest',
      ribbon: 'Altijd met tekst',
      button: 'De riskante knop,\nomlijnd',
    },
    environments: {
      head: ['Elke omgeving ', 'een eigen kleur', ''],
      sub: 'Productie, staging en test zien er nooit hetzelfde uit',
    },
    popup: {
      head: ['Markeer een site ', 'met één klik', ''],
      sub: 'Alleen toegang tot die ene site. Verzamelt geen gegevens.',
      click: 'Eén klik',
    },
    picker: {
      head: ['Bescherm ', 'de knop die ertoe doet', ''],
      sub: 'Kies een element en geef het een eigen markering',
      save: 'Bewaard voor elk bezoek',
    },
    options: {
      head: ['Stel elke markering af, ', 'zie het live', ''],
      sub: 'Kleur, lint, banner, kader, tint, titelvoorvoegsel',
      presets: 'Vaste kleuren, kleurenblind-veilig',
      preview: 'Live voorbeeld',
    },
    privacy: {
      head: ['Privé ', 'als uitgangspunt', ''],
      sub: 'Geen gegevens verzameld. Geen toegang tot je een site toevoegt.',
      checks: [
        'Geen accounts, analytics of servers',
        'Toegang per site, alleen als jij het vraagt',
        'Instellingen blijven in je browser',
      ],
    },
  },
};
