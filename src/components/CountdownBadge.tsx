import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './ui/Text';
import { countdownParts, getCountdown, isUrgent } from '@/utils/time';
import { useTranslation } from '@/i18n/useTranslation';

export interface CountdownBadgeProps {
  expiresAt: number;
  /** Larger, hero treatment for the save screen. */
  prominent?: boolean;
}

/**
 * The ever-present pressure: "Moment expires in N days." Pulses to the danger
 * colour in the final stretch. Updates itself once a minute.
 */
export function CountdownBadge({ expiresAt, prominent = false }: CountdownBadgeProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const c = getCountdown(expiresAt, now);
  const urgent = isUrgent(c);
  const tint = c.expired ? theme.colors.textTertiary : urgent ? theme.colors.danger : theme.colors.textSecondary;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: prominent ? theme.spacing.lg : theme.spacing.md,
        paddingVertical: prominent ? 8 : 5,
        borderRadius: theme.radius.pill,
        backgroundColor: urgent ? 'rgba(255,69,58,0.14)' : theme.colors.glass,
      }}
    >
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: tint,
        }}
      />
      <Text variant={prominent ? 'subhead' : 'caption'} weight="600" color={tint}>
        {(() => {
          const { key, count } = countdownParts(c);
          return t(key, { count });
        })()}
      </Text>
    </View>
  );
}
