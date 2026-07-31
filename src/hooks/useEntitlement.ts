// =============================================================================
// useEntitlement — RevenueCat-based entitlement hook
// Replaces the previous stub that returned { isPremium: false }
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initializeRevenueCat,
  getEntitlements,
  type EntitlementInfo,
} from '@/lib/revenueCat';

interface UseEntitlementReturn {
  isPremium: boolean;
  tier: 'free' | 'premium';
  expirationDate: string | null;
  isLoading: boolean;
  refreshEntitlements: () => Promise<void>;
}

export function useEntitlement(): UseEntitlementReturn {
  const [entitlement, setEntitlement] = useState<EntitlementInfo>({
    isPremium: false,
    tier: 'free',
    expirationDate: null,
    isActive: false,
    productIdentifier: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  const refreshEntitlements = useCallback(async () => {
    try {
      const info = await getEntitlements();
      setEntitlement(info);
    } catch {
      // Keep current entitlement state on error
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async (): Promise<void> => {
      try {
        await initializeRevenueCat();
        const info = await getEntitlements();
        setEntitlement(info);
      } catch {
        // Default to free tier on any error
      } finally {
        setIsLoading(false);
      }
    };

    void init();
  }, []);

  return {
    isPremium: entitlement.isPremium,
    tier: entitlement.tier,
    expirationDate: entitlement.expirationDate,
    isLoading,
    refreshEntitlements,
  };
}
