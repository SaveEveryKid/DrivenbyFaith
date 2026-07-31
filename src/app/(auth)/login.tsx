import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (): Promise<void> => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FDFBF7' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16, textAlign: 'center' }}>✝</Text>
        <Text
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 24,
            fontWeight: '700',
            color: '#3C3C3C',
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
            color: '#9B9B9B',
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 22,
          }}
        >
          Scripture for the showroom floor
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
          autoComplete="password"
          placeholder="••••••••"
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

        <PrimaryButton title="Sign In" onPress={handleSignIn} loading={loading} />
        <View style={{ height: 12 }} />
        <PrimaryButton
          title="Create an Account"
          variant="outline"
          onPress={() => router.push('/(auth)/signup')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
