import { StyleSheet, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../lib/theme';

const isWeb = Platform.OS === 'web';

export function ScreenShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFDF5', colors.cream, '#F8F0E0']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {isWeb && <div style={styles.mandala as any} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  mandala: {
    position: 'absolute',
    top: '-20%',
    right: '-30%',
    width: 500,
    height: 500,
    borderRadius: 250,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.06)',
    pointerEvents: 'none',
  },
});
