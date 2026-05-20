import { Platform } from 'react-native';
import { colors } from '../lib/theme';

const isWeb = Platform.OS === 'web';

export const glass = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    ...(isWeb ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {}),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 20,
  },
  cardElevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    ...(isWeb ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {}),
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 20,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    ...(isWeb ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
    borderWidth: 1,
    borderColor: 'rgba(232, 224, 208, 0.6)',
    borderRadius: 14,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const authContainer = {
  flex: 1,
  backgroundColor: colors.cream,
};

export const authInner = {
  flex: 1,
  justifyContent: 'center',
  paddingHorizontal: 24,
  maxWidth: 400,
  width: '100%' as const,
  alignSelf: 'center' as const,
};

export const fieldGap = {
  marginBottom: 14,
};
