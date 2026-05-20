import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import { glass } from '../styles/glass';

type Props = ViewProps & {
  elevated?: boolean;
};

export function GlassCard({ style, elevated, children, ...props }: Props) {
  return (
    <View style={[elevated ? glass.cardElevated : glass.card, style]} {...props}>
      {children}
    </View>
  );
}
