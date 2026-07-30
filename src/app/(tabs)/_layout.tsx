import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { UIFontFamily } from '@/constants/theme';

export default function TabLayout(): React.ReactElement {
  const { palette } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.clay,
        tabBarInactiveTintColor: palette.inkDim,
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.line,
        },
        tabBarLabelStyle: {
          fontFamily: UIFontFamily,
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
