import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartIcon, GearIcon, HomeLeafIcon, UserIcon } from '../../src/components/icons';
import { TabBarSpaceContext } from '../../src/components/tabBarSpace';
import { colors } from '../../src/theme';

const BAR_HEIGHT = 64;

export default function TabsLayout() {
  // The bar floats: a rounded white pill inset from the screen edges, lifted
  // above the device's bottom inset (gesture pill or the 3-button nav bar).
  // It sits over the content, so screens get its height via TabBarSpaceContext.
  const insets = useSafeAreaInsets();
  const gap = Math.max(12, insets.bottom + 4);
  const space = BAR_HEIGHT + gap + 12;

  return (
    <TabBarSpaceContext.Provider value={space}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
          tabBarItemStyle: { height: BAR_HEIGHT, paddingTop: 8 },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarStyle: {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: gap,
            height: BAR_HEIGHT,
            paddingTop: 0,
            paddingBottom: 0,
            borderRadius: 24,
            borderTopWidth: 0,
            backgroundColor: colors.card,
            shadowColor: '#1B3A35',
            shadowOpacity: 0.12,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
            elevation: 10,
          },
          // Rendered by hand: React Navigation's own label box is sized for the
          // system font and clipped Figtree's descenders ("Settinas").
          tabBarLabel: ({ color, focused, children }) => (
            <Text
              style={{
                fontFamily: focused ? 'Figtree_700Bold' : 'Figtree_600SemiBold',
                fontSize: 11,
                lineHeight: 15,
                marginTop: 2,
                color,
              }}
              numberOfLines={1}
            >
              {children}
            </Text>
          ),
          tabBarLabelPosition: 'below-icon',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <HomeLeafIcon color={color} size={22} />
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <ChartIcon color={color} size={22} />
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <UserIcon color={color} size={22} />
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon focused={focused}>
                <GearIcon color={color} size={22} />
              </TabIcon>
            ),
          }}
        />
      </Tabs>
    </TabBarSpaceContext.Provider>
  );
}

/** The active tab's icon sits in a soft teal pill, Material 3 style. */
function TabIcon({ focused, children }: { focused: boolean; children: ReactNode }) {
  return (
    <View
      style={{
        width: 52,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.accentBg : 'transparent',
      }}
    >
      {children}
    </View>
  );
}
