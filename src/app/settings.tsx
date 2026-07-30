import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeMode, TextSize } from '@/stores/themeStore';

const MODE_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

const SIZE_OPTIONS: { label: string; value: TextSize }[] = [
  { label: 'Small', value: 'small' },
  { label: 'Default', value: 'base' },
  { label: 'Large', value: 'large' },
];

export default function SettingsScreen(): React.ReactElement {
  const { mode, textSize, setMode, setTextSize } = useThemeStore();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDFBF7' }}
      contentContainerStyle={{ padding: 24 }}
    >
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          fontWeight: '600',
          color: '#6F6F6F',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        Appearance
      </Text>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {MODE_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setMode(opt.value)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: i < MODE_OPTIONS.length - 1 ? 1 : 0,
              borderBottomColor: '#F5F0E8',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 16,
                color: '#3C3C3C',
              }}
            >
              {opt.label}
            </Text>
            {mode === opt.value && (
              <Text style={{ color: '#9B7343', fontSize: 18 }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          fontWeight: '600',
          color: '#6F6F6F',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        Text Size
      </Text>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {SIZE_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setTextSize(opt.value)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: i < SIZE_OPTIONS.length - 1 ? 1 : 0,
              borderBottomColor: '#F5F0E8',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 16,
                color: '#3C3C3C',
              }}
            >
              {opt.label}
            </Text>
            {textSize === opt.value && (
              <Text style={{ color: '#9B7343', fontSize: 18 }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 14,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 16,
            color: '#C44E4E',
            textAlign: 'center',
          }}
        >
          Sign Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
