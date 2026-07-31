// Ambient type declarations for dependencies not installed in this workspace.
// When dependencies are installed via `bun install`, remove this file to pick up
// the real types from node_modules.

declare module 'expo-av' {
  export namespace Audio {
    class Sound {
      static createAsync(
        source: { uri: string },
        initialStatus?: Record<string, unknown>,
        onPlaybackStatusUpdate?: (status: Record<string, unknown>) => void,
      ): Promise<{ sound: Sound }>;
      playAsync(): Promise<void>;
      pauseAsync(): Promise<void>;
      setPositionAsync(ms: number): Promise<void>;
      setRateAsync(rate: number, shouldCorrectPitch: boolean): Promise<void>;
      getStatusAsync(): Promise<Record<string, unknown>>;
      unloadAsync(): Promise<void>;
    }
  }
}

declare module 'expo-local-authentication' {
  export function hasHardwareAsync(): Promise<boolean>;
  export function isEnrolledAsync(): Promise<boolean>;
  export function authenticateAsync(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: boolean; error?: string }>;
}

declare module 'expo-notifications' {
  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function getExpoPushTokenAsync(options?: {
    projectId?: string;
  }): Promise<{ data: string; type: string }>;
  export function setNotificationChannelAsync(
    channelId: string,
    channel: Record<string, unknown>,
  ): Promise<void>;
  export function setNotificationHandler(handler: {
    handleNotification: () => Promise<{ shouldShowAlert: boolean; shouldPlaySound: boolean; shouldSetBadge: boolean }>;
  }): void;
  export function addNotificationReceivedListener(
    listener: (event: Record<string, unknown>) => void,
  ): { remove: () => void };
  export function addNotificationResponseReceivedListener(
    listener: (event: Record<string, unknown>) => void,
  ): { remove: () => void };
  export function scheduleNotificationAsync(options: {
    content: {
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
      sound?: string;
    };
    trigger: {
      type: 'timeInterval' | 'calendar' | 'daily';
      seconds?: number;
      repeats?: boolean;
      hour?: number;
      minute?: number;
    };
  }): Promise<string>;
  export function cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  export function cancelAllScheduledNotificationsAsync(): Promise<void>;
  export function getAllScheduledNotificationsAsync(): Promise<
    Array<{ identifier: string; content: { title?: string; body?: string }; trigger: Record<string, unknown> }>
  >;
}

declare module 'react-native-purchases' {
  export interface PurchasesOfferings {
    current: PurchasesOffering | null;
    all: Record<string, PurchasesOffering>;
  }

  export interface PurchasesOffering {
    identifier: string;
    availablePackages: PurchasesPackage[];
    monthly?: PurchasesPackage | null;
    annual?: PurchasesPackage | null;
    lifetime?: PurchasesPackage | null;
    sixMonth?: PurchasesPackage | null;
    threeMonth?: PurchasesPackage | null;
    twoMonth?: PurchasesPackage | null;
    weekly?: PurchasesPackage | null;
  }

  export interface PurchasesPackage {
    identifier: string;
    packageType: string;
    product: PurchasesProduct;
    offeringIdentifier: string;
  }

  export interface PurchasesProduct {
    identifier: string;
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
    subscriptionPeriod?: string | null;
    introductoryPrice?: {
      price: number;
      priceString: string;
      cycles: number;
      period: string;
    } | null;
  }

  export interface CustomerInfo {
    entitlements: {
      active: Record<string, { identifier: string }>;
    };
    activeSubscriptions: string[];
    latestExpirationDate: string | null;
  }

  export const Purchases: {
    configure(options: { apiKey: string; appUserID?: string }): void;
    getOfferings(): Promise<PurchasesOfferings>;
    purchasePackage(pkg: PurchasesPackage): Promise<{ customerInfo: CustomerInfo }>;
    restorePurchases(): Promise<CustomerInfo>;
    getCustomerInfo(): Promise<CustomerInfo>;
    logIn(userID: string): Promise<{ customerInfo: CustomerInfo; created: boolean }>;
    logOut(): Promise<CustomerInfo>;
    setAttributes(attributes: Record<string, string>): void;
  };
  export default Purchases;
}
