import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';
import { Text } from './Text';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  /** Haptic on press. Defaults to a light tap for primary actions. */
  haptic?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled,
  loading,
  icon,
  fullWidth = true,
  style,
  haptic = true,
}: ButtonProps) {
  const theme = useTheme();
  const heights: Record<Size, number> = { lg: 56, md: 48, sm: 40 };
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    if (haptic) haptics.light();
    onPress?.();
  };

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.onAccent : theme.colors.text} />
      ) : (
        <>
          {icon}
          <Text
            variant="headline"
            color={
              variant === 'primary'
                ? 'onAccent'
                : variant === 'danger'
                  ? 'danger'
                  : 'text'
            }
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );

  const base: ViewStyle = {
    height: heights[size],
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    opacity: isDisabled ? 0.5 : 1,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
  };

  if (variant === 'primary') {
    return (
      <PressableScale onPress={handlePress} disabled={isDisabled} haptic={false} style={[base, style]}>
        <LinearGradient
          colors={[theme.colors.accent, shade(theme.colors.accent)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: theme.radius.lg }]}
        />
        {content}
      </PressableScale>
    );
  }

  const variantStyle: ViewStyle =
    variant === 'secondary'
      ? { backgroundColor: theme.colors.surfaceElevated }
      : variant === 'danger'
        ? { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.danger }
        : { backgroundColor: 'transparent' };

  return (
    <PressableScale
      onPress={handlePress}
      disabled={isDisabled}
      haptic={false}
      style={[base, variantStyle, style]}
    >
      {content}
    </PressableScale>
  );
}

/** Slightly darken a hex accent for the gradient end stop. */
function shade(hex: string, amount = 0.82): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = Math.round(parseInt(full.slice(0, 2), 16) * amount);
  const g = Math.round(parseInt(full.slice(2, 4), 16) * amount);
  const b = Math.round(parseInt(full.slice(4, 6), 16) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
