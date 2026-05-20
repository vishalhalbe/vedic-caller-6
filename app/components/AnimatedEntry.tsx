import { useRef, useEffect } from 'react';
import { Animated, AccessibilityInfo } from 'react-native';
import { useReduceMotion } from '../lib/hooks/use-reduce-motion';

type Props = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
};

export function AnimatedEntry({ children, delay = 0, duration = 400 }: Props) {
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 20)).current;

  useEffect(() => {
    if (reduceMotion) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
    ]).start();
  }, [reduceMotion]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export function StaggerChildren({ children, staggerBy = 80 }: { children: React.ReactNode; staggerBy?: number }) {
  return <>{children}</>;
}
