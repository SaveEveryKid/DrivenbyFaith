// =============================================================================
// Paywall screen — full-screen modal shown when a premium feature is accessed
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useEntitlement } from '@/hooks/useEntitlement';
import { ScriptureFontFamily, UIFontFamily } from '@/constants/theme';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  type OfferingPackage,
  type OfferingsData,
} from '@/lib/revenueCat';

interface FeatureItem {
  label: string;
  free: string;
  premium: string;
}

const FEATURE_COMPARISON: FeatureItem[] = [
  {
    label: 'Daily devotional',
    free: 'Full access',
    premium: 'Full access',
  },
  {
    label: 'AI Coach messages',
    free: '5 per day',
    premium: 'Unlimited',
  },
  {
    label: 'Situation library',
    free: 'Free situations only',
    premium: 'Full library',
  },
  {
    label: 'Reading plans',
    free: 'Free plans only',
    premium: 'All plans',
  },
  {
    label: 'Saturday Ready',
    free: 'Free editions',
    premium: 'Full access',
  },
  {
    label: 'Prayer groups',
    free: 'Join up to 2',
    premium: 'Unlimited',
  },
  {
    label: 'Deal debriefs',
    free: '3 per week',
    premium: 'Unlimited',
  },
];

export default function PaywallScreen(): React.ReactElement {
  const router = useRouter();
  const { palette, isDark } = useTheme();
  const { refreshEntitlements, isPremium: alreadyPremium } = useEntitlement();
  const [offerings, setOfferings] = useState<OfferingsData | null>(null);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // ── Load offerings ─────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const data = await getOfferings();
        setOfferings(data);
      } catch {
        // Offerings failed to load; show default pricing
      } finally {
        setIsLoadingOfferings(false);
      }
    };
    void load();
  }, []);

  // ── If already premium, go back ────────────────────────────────────────────

  useEffect(() => {
    if (alreadyPremium) {
      router.back();
    }
  }, [alreadyPremium, router]);

  // ── Purchase handler ───────────────────────────────────────────────────────

  const handlePurchase = async (pkg: OfferingPackage): Promise<void> => {
    setIsPurchasing(true);
    setPurchasingId(pkg.identifier);

    try {
      const result = await purchasePackage(pkg);

      if (result.success) {
        await refreshEntitlements();
        router.back();
      } else if (result.errorMessage) {
        Alert.alert(
          'Could not complete purchase',
          result.errorMessage,
        );
      }
    } catch {
      Alert.alert(
        'Could not complete purchase',
        'Purchase could not be completed. Please try again.',
      );
    } finally {
      setIsPurchasing(false);
      setPurchasingId(null);
    }
  };

  // ── Restore handler ────────────────────────────────────────────────────────

  const handleRestore = async (): Promise<void> => {
    setIsRestoring(true);
    try {
      const result = await restorePurchases();

      if (result.success) {
        await refreshEntitlements();
        router.back();
      } else if (result.errorMessage) {
        Alert.alert('Restore purchases', result.errorMessage);
      }
    } catch {
      Alert.alert(
        'Could not restore purchases',
        'Please try again.',
      );
    } finally {
      setIsRestoring(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const monthlyPkg = offerings?.monthly;
  const annualPkg = offerings?.annual;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Close button */}
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityLabel="Close paywall"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: palette.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 18,
            color: palette.muted,
          }}
        >
          ✕
        </Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
        <Text
          style={{
            fontFamily: ScriptureFontFamily,
            fontSize: 28,
            color: palette.ink,
            textAlign: 'center',
            marginBottom: 12,
            lineHeight: 36,
          }}
        >
          Feed the work that feeds your soul
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 15,
            color: palette.muted,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          Premium gives you unlimited access to everything in Driven by Faith.
          Your support keeps the daily devotional free for every sales professional
          who needs it.
        </Text>
      </View>

      {/* Pricing options */}
      {isLoadingOfferings ? (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator color={palette.clay} size="small" />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          {/* Monthly option */}
          <TouchableOpacity
            onPress={() => {
              if (monthlyPkg) void handlePurchase(monthlyPkg);
            }}
            disabled={isPurchasing || !monthlyPkg}
            accessibilityLabel={
              monthlyPkg
                ? `Subscribe monthly — ${monthlyPkg.product.priceString} per month`
                : 'Monthly subscription'
            }
            style={{
              backgroundColor: palette.surface,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: palette.clay,
              padding: 20,
              marginBottom: 12,
              opacity: isPurchasing ? 0.6 : 1,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 18,
                    fontWeight: '600',
                    color: palette.ink,
                  }}
                >
                  Monthly
                </Text>
                {monthlyPkg?.product.introductoryPrice ? (
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: 13,
                      color: palette.sage,
                      marginTop: 4,
                    }}
                  >
                    Free trial available
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 20,
                    fontWeight: '700',
                    color: palette.ink,
                  }}
                >
                  {monthlyPkg?.product.priceString ?? '—'}
                </Text>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 13,
                    color: palette.muted,
                  }}
                >
                  per month
                </Text>
              </View>
            </View>
            {purchasingId === monthlyPkg?.identifier && (
              <ActivityIndicator
                color={palette.clay}
                size="small"
                style={{ marginTop: 12 }}
              />
            )}
          </TouchableOpacity>

          {/* Annual option */}
          <TouchableOpacity
            onPress={() => {
              if (annualPkg) void handlePurchase(annualPkg);
            }}
            disabled={isPurchasing || !annualPkg}
            accessibilityLabel={
              annualPkg
                ? `Subscribe annually — ${annualPkg.product.priceString} per year`
                : 'Annual subscription'
            }
            style={{
              backgroundColor: palette.clay,
              borderRadius: 12,
              padding: 20,
              marginBottom: 12,
              opacity: isPurchasing ? 0.6 : 1,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#FFFFFF',
                  }}
                >
                  Annual
                </Text>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.8)',
                    marginTop: 4,
                  }}
                >
                  Best value
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}
                >
                  {annualPkg?.product.priceString ?? '—'}
                </Text>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  per year
                </Text>
              </View>
            </View>
            {purchasingId === annualPkg?.identifier && (
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
                style={{ marginTop: 12 }}
              />
            )}
          </TouchableOpacity>

          {/* Restore purchases */}
          <TouchableOpacity
            onPress={() => void handleRestore()}
            disabled={isRestoring}
            accessibilityLabel="Restore purchases"
            style={{
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            {isRestoring ? (
              <ActivityIndicator color={palette.muted} size="small" />
            ) : (
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 14,
                  color: palette.muted,
                  textDecorationLine: 'underline',
                }}
              >
                Restore purchases
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Feature comparison */}
      <View style={{ paddingHorizontal: 24 }}>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            fontWeight: '600',
            color: palette.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
          }}
        >
          What you get
        </Text>

        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {FEATURE_COMPARISON.map((item, i) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth:
                  i < FEATURE_COMPARISON.length - 1 ? 1 : 0,
                borderBottomColor: palette.line,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily: UIFontFamily,
                  fontSize: 14,
                  color: palette.ink,
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 13,
                  color: palette.muted,
                  width: 100,
                  textAlign: 'right',
                }}
              >
                {item.free}
              </Text>
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 13,
                  fontWeight: '600',
                  color: palette.clay,
                  width: 100,
                  textAlign: 'right',
                }}
              >
                {item.premium}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Mission statement */}
      <View style={{ paddingHorizontal: 32, marginTop: 32, alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: ScriptureFontFamily,
            fontSize: 15,
            color: palette.inkDim,
            textAlign: 'center',
            lineHeight: 22,
            fontStyle: 'italic',
          }}
        >
          "Whatever you do, work heartily, as for the Lord and not for men."
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 12,
            color: palette.inkDim,
            marginTop: 4,
          }}
        >
          Colossians 3:23
        </Text>
      </View>
    </ScrollView>
  );
}
