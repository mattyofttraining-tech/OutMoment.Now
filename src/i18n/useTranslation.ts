import { useAppStore } from '@/store/useAppStore';
import { i18n } from './index';

/**
 * Reactive translation hook. Reading `locale` from the store subscribes the
 * component, so switching language in Settings re-renders every screen.
 */
export function useTranslation() {
  const locale = useAppStore((s) => s.locale);
  i18n.locale = locale;
  const t = (key: string, options?: Record<string, unknown>): string => i18n.t(key, options);
  return { t, locale };
}
