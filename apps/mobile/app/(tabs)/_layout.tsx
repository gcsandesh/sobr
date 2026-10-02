import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartIcon, GearIcon, HomeLeafIcon, UserIcon } from '../../src/components/icons';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  // A custom tabBarStyle.height takes over from React Navigation's own
  // safe-area handling, so the device's bottom inset (gesture pill OR the
  // 3-button nav bar some Android phones — e.g. Galaxy S24 Ultra — still use)
  // has to be added back in by hand, or the bar sits under it.
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        // the item fills the bar's content area; without this it kept a fixed
        // default height and cut off the label's lower half
        tabBarItemStyle: { height: 52 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          // warm white, a step lighter than the cream canvas, so the bar reads
          // as a floating surface rather than blending into the content
          backgroundColor: colors.card,
          borderTopWidth: 0,
          // icon (24) + label line + breathing room; anything under ~68 clips
          // the label's descenders on web and small Android phones
          height: 70 + insets.bottom,
          paddingBottom: Math.max(12, insets.bottom),
          paddingTop: 8,
          // soft floating-bar elevation instead of a hairline border
          shadowColor: '#16211F',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
        // Rendered by hand: React Navigation's own label box is sized for the
        // system font and clipped Figtree's descenders ("Settinas").
        tabBarLabel: ({ color, children }) => (
          <Text
            style={{
              fontFamily: 'Figtree_600SemiBold',
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
          tabBarIcon: ({ color }) => <HomeLeafIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <ChartIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <GearIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
