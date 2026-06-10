import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';
import { Text } from './Text';

export interface BrandMarkProps {
  /**
   * `badge`   — logo + wordmark side by side (headers, store).
   * `whisper` — small, low-opacity mark for quiet corners of any screen.
   * `hero`    — large stacked mark for welcome/onboarding moments.
   */
  variant?: 'badge' | 'whisper' | 'hero';
  /** Force light (white) text, for use over photos. */
  onPhoto?: boolean;
  style?: ViewStyle;
}

const LOGO = require('../../../assets/images/ourmoment-logo.png');

/**
 * The OurMoment brand mark. One component so the logo, wordmark, spacing and
 * type treatment stay pixel-identical on every screen, app and PWA alike.
 */
export function BrandMark({ variant = 'badge', onPhoto = false, style }: BrandMarkProps) {
  const theme = useTheme();
  const textColor = onPhoto ? 'rgba(255,255,255,0.92)' : theme.colors.text;

  if (variant === 'hero') {
    return (
      <View style={[{ alignItems: 'center', gap: 10 }, style]}>
        <Image
          source={LOGO}
          style={{ width: 64, height: 64, borderRadius: 16 }}
          contentFit="cover"
          accessibilityLabel="OurMoment logo"
        />
        <Text variant="title3" weight="700" color={textColor} style={{ letterSpacing: 0.4 }}>
          OurMoment
        </Text>
      </View>
    );
  }

  if (variant === 'whisper') {
    return (
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.55 }, style]}>
        <Image
          source={LOGO}
          style={{ width: 18, height: 18, borderRadius: 5 }}
          contentFit="cover"
          accessibilityLabel="OurMoment logo"
        />
        <Text variant="overline" color={textColor}>
          OURMOMENT
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>
      <Image
        source={LOGO}
        style={{ width: 40, height: 40, borderRadius: 10 }}
        contentFit="cover"
        accessibilityLabel="OurMoment logo"
      />
      <Text variant="title3" weight="700" color={textColor}>
        OurMoment
      </Text>
    </View>
  );
}
