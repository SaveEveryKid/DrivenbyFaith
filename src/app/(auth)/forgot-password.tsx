import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'expo-router';
import { useAuth } from '@/lib/AuthProvider';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useTheme } from '@/hooks/useTheme';

// ─── Validation schema ───────────────────────────────────────────────────────

const resetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ResetFormValues = z.infer<typeof resetSchema>;

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen(): React.ReactElement {
  const { colors } = useTheme();
  const { sendPasswordReset } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ResetFormValues): Promise<void> => {
    setIsSubmitting(true);
    const { error } = await sendPasswordReset(values.email);
    setIsSubmitting(false);

    if (!error) {
      setSentTo(values.email);
      setSuccess(true);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 24 }}>✉</Text>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 22,
              fontWeight: '700',
              color: colors.text,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Check your email
          </Text>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 32,
            }}
          >
            If an account exists for {sentTo}, we sent a password reset link.
            Please check your inbox and follow the instructions.
          </Text>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.accent,
                }}
              >
                Back to sign in
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

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
            paddingTop: 48,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 24,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Reset your password
            </Text>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 15,
                color: colors.textSecondary,
                lineHeight: 22,
              }}
            >
              Enter your email address and we will send you a link to reset your
              password.
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

          {/* Send reset button */}
          <PrimaryButton
            title="Send reset link"
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            accessibilityLabel="Send password reset link"
          />

          {/* Back to login */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 24,
            }}
          >
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.accent,
                  }}
                >
                  Back to sign in
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
