import { useRef, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const reduced = useRef(false);

  // Check once on mount — this is sufficient for most use cases
  useCallback(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduced.current = enabled;
    });
  }, [])();

  return reduced.current;
}
