import { useWindowDimensions, PixelRatio, Platform } from 'react-native';

const BASE_WIDTH = 375;
const BREAKPOINTS = { tablet: 768, desktop: 1024 } as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const deviceType = width >= BREAKPOINTS.desktop ? 'desktop'
    : width >= BREAKPOINTS.tablet ? 'tablet'
    : 'phone';

  const scale = Math.min(Math.max(width / BASE_WIDTH, 0.8), 1.4);
  const fontScale = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.3);

  const sp = (n: number) => Math.round(n * scale);
  const fs = (n: number) => Math.round(n * fontScale);

  const isMobile = Platform.OS !== 'web' || width < BREAKPOINTS.tablet;
  const isReduceMotion = false;

  return { width, height, deviceType, scale, fontScale, sp, fs, isMobile, isReduceMotion };
}
