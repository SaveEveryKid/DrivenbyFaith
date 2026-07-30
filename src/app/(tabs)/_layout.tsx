import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout(): React.ReactElement {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: 'Prayer',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
