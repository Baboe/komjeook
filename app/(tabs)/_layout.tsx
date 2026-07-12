import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { HomeIcon, CalendarIcon, MessageIcon, PersonIcon } from '../../components/Icon';
import { Text } from '../../components/Text';
import { colors, fonts } from '../../constants/theme';

function TabIcon({ focused, children, label }: { focused: boolean; children: React.ReactNode; label: string }) {
  const color = focused ? colors.terracotta : colors.warmGrayLight;
  return (
    <View style={styles.tabItem}>
      {children}
      <Text
        style={[
          styles.tabLabel,
          { color, fontFamily: focused ? fonts.bodyMedium : fonts.body },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.bar,
        tabBarItemStyle: { paddingTop: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Kom je ook?">
              <HomeIcon color={focused ? colors.terracotta : colors.warmGrayLight} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="mijn-oproepen"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Mijn oproepen">
              <CalendarIcon color={focused ? colors.terracotta : colors.warmGrayLight} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="berichten"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Berichten">
              <MessageIcon color={focused ? colors.terracotta : colors.warmGrayLight} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profiel"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Profiel">
              <PersonIcon color={focused ? colors.terracotta : colors.warmGrayLight} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.creamDark,
    height: 78,
    paddingBottom: 14,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', width: 80 },
  tabLabel: { fontSize: 10, marginTop: 4, textAlign: 'center' },
});
