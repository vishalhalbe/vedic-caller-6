import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  gold: '#D4AF37',
  cream: '#FAF9F6',
  dark: '#1A1006',
  muted: '#5C4A32',
};

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VedicCaller</Text>
      <Text style={styles.subtitle}>Connect with trusted astrologers</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.muted,
    marginTop: 8,
  },
});
