import { StyleSheet, View, Platform, type ViewProps } from 'react-native';
import { colors } from '../lib/theme';
import { glass } from '../styles/glass';

const isWeb = Platform.OS === 'web';
const SHADOW = isWeb
  ? {
      boxShadow: '0 8px 32px rgba(212, 175, 55, 0.10), 0 2px 8px rgba(0, 0, 0, 0.04)',
    }
  : {
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 4,
    };

type Props = ViewProps & {
  elevated?: boolean;
};

export function GlassCard({ style, elevated, children, ...props }: Props) {
  const el = elevated ?? false;
  return (
    <View
      style={[
        glass.card,
        el && glass.cardElevated,
        el && (isWeb ? SHADOW : {}),
        el && Platform.OS !== 'web' ? { borderColor: 'rgba(212, 175, 55, 0.4)' } : {},
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
