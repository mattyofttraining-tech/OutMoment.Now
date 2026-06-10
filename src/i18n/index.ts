import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { translations, SUPPORTED_LOCALES, type LocaleCode } from './translations';

export const i18n = new I18n(translations);
i18n.enableFallback = true; // missing keys fall back to English
i18n.defaultLocale = 'en';

export { SUPPORTED_LOCALES };
export type { LocaleCode };

const SUPPORTED_CODES = SUPPORTED_LOCALES.map((l) => l.code) as string[];

export function isSupportedLocale(code: string | null | undefined): code is LocaleCode {
  return !!code && SUPPORTED_CODES.includes(code);
}

/** Best match between the device's preferred languages and our supported set. */
export function deviceLocale(): LocaleCode {
  for (const l of Localization.getLocales()) {
    const lang = (l.languageCode ?? '').toLowerCase();
    if (isSupportedLocale(lang)) return lang;
  }
  return 'en';
}

export function setI18nLocale(code: LocaleCode): void {
  i18n.locale = code;
}

const LANGUAGE_NAMES: Record<LocaleCode, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  nl: 'Dutch',
  pt: 'Portuguese',
  pl: 'Polish',
  da: 'Danish',
  sv: 'Swedish',
};

/** English name of the active UI language — sent to the AI quest generator so
 *  generated quests come back in the host's language. */
export function currentLanguageName(): string {
  return LANGUAGE_NAMES[i18n.locale as LocaleCode] ?? 'English';
}
