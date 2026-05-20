import { useState } from 'react';
import { StyleSheet, AccessibilityInfo } from 'react-native';
import { useEffect } from 'react';

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);

  return reduce;
}
