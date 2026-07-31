import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SignupScreen(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSignUp = async (): Promise<void> => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (!data.session) {
      setCheckEmail(true);
    }
  };

  if (checkEmail) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          backgroundColor: '#FDFBF7',
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>✉️</Text>
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 20,
            fontWeight: '600',
            color: '#3C3C3C',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Check your email
        </Text>
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15,
            color: '#9B9B9B',
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
          }}
        >
          We sent a confirmation link to {email.trim()}. Confirm your email, then sign in.
        </Text>
        <PrimaryButton title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FDFBF7' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}>
        <Text
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: '700',
            color: '#3C3C3C',
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          Create your account
        </Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <TextField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="Re-enter your password"
        />

        {error && (
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              color: '#C44E4E',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
        )}

        <PrimaryButton title="Create Account" onPress={handleSignUp} loading={loading} />
        <View style={{ height: 12 }} />
        <PrimaryButton
          title="Back to Login"
          variant="outline"
          onPress={() => router.replace('/(auth)/login')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
