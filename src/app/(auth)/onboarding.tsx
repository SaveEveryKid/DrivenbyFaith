import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Profile } from '@/types/database';

const FAITH_CONTEXT_OPTIONS: { label: string; value: NonNullable<Profile['faith_context']> }[] = [
  { label: 'New to faith', value: 'new_to_faith' },
  { label: 'Coming back', value: 'coming_back' },
  { label: 'Walking steady', value: 'walking_steady' },
  { label: 'Leading others', value: 'leading_others' },
];

const BURDEN_OPTIONS = [
  'Integrity pressure',
  'Burnout',
  'Financial stress',
  'Anger',
  'Comparison',
  'Family strain',
  'Fear',
  'Temptation',
];

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: selected ? '#9B7343' : '#E0D1B8',
        backgroundColor: selected ? '#9B7343' : '#FFFFFF',
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          color: selected ? '#FFFFFF' : '#3C3C3C',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SectionLabel({ children }: { children: string }): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 13,
        fontWeight: '600',
        color: '#6F6F6F',
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

export default function OnboardingScreen(): React.ReactElement {
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [displayName, setDisplayName] = useState('');
  const [dealership, setDealership] = useState('');
  const [faithContext, setFaithContext] = useState<Profile['faith_context']>(null);
  const [burdens, setBurdens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBurden = (burden: string): void => {
    setBurdens((prev) =>
      prev.includes(burden) ? prev.filter((b) => b !== burden) : [...prev, burden],
    );
  };

  const handleContinue = async (): Promise<void> => {
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be signed in.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        dealership: dealership.trim() || null,
        faith_context: faithContext,
        burdens,
        onboarding_complete: true,
      })
      .eq('id', user.id);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await refreshProfile();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDFBF7' }}
      contentContainerStyle={{ padding: 24, paddingTop: 48 }}
    >
      <Text
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 24,
          fontWeight: '700',
          color: '#3C3C3C',
          marginBottom: 8,
        }}
      >
        Tell us about you
      </Text>
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          color: '#9B9B9B',
          marginBottom: 24,
          lineHeight: 20,
        }}
      >
        This helps us shape your daily devotionals and coaching to your walk and your work.
      </Text>

      <TextField
        label="Your name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Jordan Smith"
      />
      <TextField
        label="Dealership (optional)"
        value={dealership}
        onChangeText={setDealership}
        placeholder="Where you work"
      />

      <SectionLabel>Where are you in your faith?</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 }}>
        {FAITH_CONTEXT_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={faithContext === opt.value}
            onPress={() => setFaithContext(opt.value)}
          />
        ))}
      </View>

      <SectionLabel>What are you carrying right now? (select any)</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 }}>
        {BURDEN_OPTIONS.map((burden) => (
          <Chip
            key={burden}
            label={burden}
            selected={burdens.includes(burden)}
            onPress={() => toggleBurden(burden)}
          />
        ))}
      </View>

      {error && (
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            color: '#C44E4E',
            marginBottom: 16,
          }}
        >
          {error}
        </Text>
      )}

      <PrimaryButton title="Continue" onPress={handleContinue} loading={loading} />
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
