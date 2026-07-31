import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useJoinGroup } from '@/hooks/usePrayer';
import { PrimaryButton } from '@/components/PrimaryButton';
import { UIFontFamily } from '@/constants/theme';

export default function JoinGroupScreen(): React.ReactElement {
  const { palette } = useTheme();
  const router = useRouter();
  const { joinGroup, isJoining } = useJoinGroup();

  const [code, setCode] = useState('');

  const canSubmit = code.trim().length === 6 && !isJoining;

  const handleJoin = async (): Promise<void> => {
    if (!canSubmit) return;

    try {
      await joinGroup(code.trim());
      Alert.alert('Joined', 'You are now a member of this group.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not join group.';
      Alert.alert('Could not join', message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: palette.bg }}
    >
      <View
        style={{
          flex: 1,
          padding: 16,
          paddingTop: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 40,
            marginBottom: 16,
          }}
        >
          🕊
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 24,
            fontWeight: '700',
            color: palette.ink,
            marginBottom: 8,
          }}
        >
          Join a Prayer Group
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.muted,
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 20,
            paddingHorizontal: 16,
          }}
        >
          Enter the 6-character code shared by your group leader.
        </Text>

        <TextInput
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase())}
          placeholder="ABCDEF"
          placeholderTextColor={palette.inkDim}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isJoining}
          accessibilityLabel="6-character join code"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 32,
            fontWeight: '700',
            color: palette.clay,
            textAlign: 'center',
            letterSpacing: 8,
            backgroundColor: palette.surface,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: palette.clay,
            paddingVertical: 16,
            paddingHorizontal: 24,
            marginBottom: 24,
            width: '100%',
            maxWidth: 280,
          }}
        />

        <PrimaryButton
          title={isJoining ? 'Joining...' : 'Join Group'}
          loading={isJoining}
          onPress={handleJoin}
          disabled={!canSubmit}
          accessibilityLabel="Join prayer group with code"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
