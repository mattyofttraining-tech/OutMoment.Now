import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { PressableScale } from './PressableScale';

export interface IconButtonProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  size?: number;
  color?: string;
  /** Render a translucent circular surface behind the icon. */
  surface?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  name,
  onPress,
  size = 24,
  color,
  surface = false,
  disabled,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const dimension = size + 20;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic
      style={[
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
          backgroundColor: surface ? theme.colors.glass : 'transparent',
        },
        style,
      ]}
    >
      <View>
        <Ionicons name={name} size={size} color={color ?? theme.colors.text} />
      </View>
    </PressableScale>
  );
}
