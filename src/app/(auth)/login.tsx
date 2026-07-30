import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router, Link } from 'expo-router';
import { useAuth } from '@/lib/AuthProvider';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useTheme } from '@/hooks/useTheme';

// ─── Validation schema ───────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LoginScreen(): React.ReactElement {
  const { colors } = useTheme();
  const { signInWithEmail, signInWithApple, signInWithGoogle, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setIsSubmitting(true);
    const { error } = await signInWithEmail(values.email, values.password);
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Sign in failed', error);
    }
    // Successful sign-in is handled by the auth guard redirect
  };

  const handleAppleSignIn = async (): Promise<void> => {
    try {
      await signInWithApple();
    } catch {
      // Error is handled in AuthProvider
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      await signInWithGoogle();
    } catch {
      // Error is handled in AuthProvider
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 32,
            paddingTop: 64,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>✝</Text>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 24,
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Driven by Faith
            </Text>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 15,
                color: colors.textMuted,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              Scripture for the floor you actually work.
            </Text>
          </View>

          {/* Email field */}
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: 6,
            }}
          >
            Email
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 16,
                  color: colors.text,
                  backgroundColor: colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: errors.email ? colors.error : colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 4,
                }}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                accessibilityLabel="Email address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email && (
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                color: colors.error,
                marginBottom: 12,
              }}
            >
              {errors.email.message}
            </Text>
          )}
          {!errors.email && <View style={{ height: 4, marginBottom: 12 }} />}

          {/* Password field */}
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: 6,
            }}
          >
            Password
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 16,
                  color: colors.text,
                  backgroundColor: colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: errors.password ? colors.error : colors.border,
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 4,
                }}
                placeholder="Your password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                accessibilityLabel="Password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password && (
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                color: colors.error,
                marginBottom: 12,
              }}
            >
              {errors.password.message}
            </Text>
          )}
          {!errors.password && <View style={{ height: 4, marginBottom: 12 }} />}

          {/* Forgot password */}
          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 14,
                  color: colors.accent,
                }}
              >
                Forgot password?
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Sign in button */}
          <PrimaryButton
            title="Sign in"
            loading={isSubmitting || isLoading}
            onPress={handleSubmit(onSubmit)}
            accessibilityLabel="Sign in"
          />

          {/* Divider */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 24,
            }}
          >
            <View
              style={{ flex: 1, height: 1, backgroundColor: colors.border }}
            />
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                color: colors.textMuted,
                marginHorizontal: 16,
              }}
            >
              or continue with
            </Text>
            <View
              style={{ flex: 1, height: 1, backgroundColor: colors.border }}
            />
          </View>

          {/* Social sign-in buttons */}
          <View style={{ gap: 12 }}>
            <PrimaryButton
              title="Continue with Apple"
              variant="outline"
              onPress={handleAppleSignIn}
              accessibilityLabel="Sign in with Apple"
            />
            <PrimaryButton
              title="Continue with Google"
              variant="outline"
              onPress={handleGoogleSignIn}
              accessibilityLabel="Sign in with Google"
            />
          </View>

          {/* Sign up link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 32,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14,
                color: colors.textSecondary,
              }}
            >
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.accent,
                  }}
                >
                  Sign up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
