// =============================================================================
// RevenueCat service — wraps react-native-purchases for subscriptions
// =============================================================================

import { Platform } from 'react-native';

// RevenueCat is lazy-loaded so the app doesn't crash when keys aren't configured
let Purchases: typeof import('react-native-purchases').default | null = null;
let isConfigured = false;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EntitlementInfo {
  isPremium: boolean;
  tier: 'free' | 'premium';
  expirationDate: string | null;
  isActive: boolean;
  productIdentifier: string | null;
}

export interface OfferingPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
    subscriptionPeriod: string | null;
    introductoryPrice: {
      price: number;
      priceString: string;
      cycles: number;
      period: string;
    } | null;
  };
}

export interface OfferingsData {
  monthly: OfferingPackage | null;
  annual: OfferingPackage | null;
  current: import('react-native-purchases').PurchasesOfferings | null;
}

export interface PurchaseResult {
  success: boolean;
  errorMessage?: string;
}

// ─── Initialize ──────────────────────────────────────────────────────────────

export async function initializeRevenueCat(): Promise<void> {
  if (isConfigured) return;

  try {
    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY,
      default: undefined,
    });

    if (!apiKey) {
      console.warn('[RevenueCat] No API key configured for this platform');
      return;
    }

    // Dynamic import so the app doesn't crash without RevenueCat installed
    const purchasesModule = await import('react-native-purchases');
    Purchases = purchasesModule.default;

    Purchases.configure({ apiKey });
    isConfigured = true;
  } catch (err) {
    console.warn('[RevenueCat] Failed to initialize:', err);
  }
}

// ─── Get entitlements ────────────────────────────────────────────────────────

export async function getEntitlements(): Promise<EntitlementInfo> {
  if (!isConfigured) {
    return {
      isPremium: false,
      tier: 'free',
      expirationDate: null,
      isActive: false,
      productIdentifier: null,
    };
  }

  try {
    const customerInfo = await Purchases!.getCustomerInfo();

    const premiumEntitlement = customerInfo.entitlements.active['premium'];

    if (premiumEntitlement) {
      return {
        isPremium: true,
        tier: 'premium',
        expirationDate: premiumEntitlement.expirationDate ?? null,
        isActive: premiumEntitlement.isActive,
        productIdentifier: premiumEntitlement.productIdentifier,
      };
    }

    return {
      isPremium: false,
      tier: 'free',
      expirationDate: null,
      isActive: false,
      productIdentifier: null,
    };
  } catch {
    return {
      isPremium: false,
      tier: 'free',
      expirationDate: null,
      isActive: false,
      productIdentifier: null,
    };
  }
}

// ─── Get offerings ───────────────────────────────────────────────────────────

export async function getOfferings(): Promise<OfferingsData> {
  if (!isConfigured) {
    return { monthly: null, annual: null, current: null };
  }

  try {
    const offerings = await Purchases!.getOfferings();
    const current = offerings.current;

    if (!current) {
      return { monthly: null, annual: null, current: null };
    }

    const monthly = current.monthly ?? null;
    const annual = current.annual ?? null;

    const mapPackage = (pkg: typeof monthly): OfferingPackage | null => {
      if (!pkg) return null;
      return {
        identifier: pkg.identifier,
        packageType: pkg.packageType,
        product: {
          identifier: pkg.product.identifier,
          title: pkg.product.title,
          description: pkg.product.description,
          price: pkg.product.price,
          priceString: pkg.product.priceString,
          currencyCode: pkg.product.currencyCode,
          subscriptionPeriod: pkg.product.subscriptionPeriod ?? null,
          introductoryPrice: pkg.product.introductoryPrice
            ? {
                price: pkg.product.introductoryPrice.price,
                priceString: pkg.product.introductoryPrice.priceString,
                cycles: pkg.product.introductoryPrice.cycles,
                period: pkg.product.introductoryPrice.period,
              }
            : null,
        },
      };
    };

    return {
      monthly: mapPackage(monthly),
      annual: mapPackage(annual),
      current,
    };
  } catch {
    return { monthly: null, annual: null, current: null };
  }
}

// ─── Purchase ────────────────────────────────────────────────────────────────

export async function purchasePackage(
  pkg: OfferingPackage,
): Promise<PurchaseResult> {
  if (!isConfigured) {
    return {
      success: false,
      errorMessage: 'Purchase could not be completed. Please try again.',
    };
  }

  try {
    const offerings = await Purchases!.getOfferings();
    const rcPackage = offerings.current?.availablePackages.find(
      (p: { identifier: string }) => p.identifier === pkg.identifier,
    );

    if (!rcPackage) {
      return {
        success: false,
        errorMessage: 'Purchase could not be completed. Please try again.',
      };
    }

    const { customerInfo } = await Purchases!.purchasePackage(rcPackage);

    const premiumEntitlement = customerInfo.entitlements.active['premium'];

    if (premiumEntitlement && premiumEntitlement.isActive) {
      return { success: true };
    }

    return {
      success: false,
      errorMessage: 'Purchase could not be completed. Please try again.',
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : 'Purchase could not be completed. Please try again.';

    // Don't show "user cancelled" as an error to the user
    if (
      message.includes('cancelled') ||
      message.includes('cancel') ||
      message.includes('user cancelled')
    ) {
      return { success: false, errorMessage: undefined };
    }

    return { success: false, errorMessage: message };
  }
}

// ─── Restore ─────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isConfigured) {
    return {
      success: false,
      errorMessage: 'Could not restore purchases. Please try again.',
    };
  }

  try {
    const customerInfo = await Purchases!.restorePurchases();

    const premiumEntitlement = customerInfo.entitlements.active['premium'];

    if (premiumEntitlement && premiumEntitlement.isActive) {
      return { success: true };
    }

    return {
      success: false,
      errorMessage: 'No active subscription found to restore.',
    };
  } catch {
    return {
      success: false,
      errorMessage: 'Could not restore purchases. Please try again.',
    };
  }
}

// ─── Is configured check ─────────────────────────────────────────────────────

export function isRevenueCatConfigured(): boolean {
  return isConfigured;
}
