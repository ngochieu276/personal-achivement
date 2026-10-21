import { Tabs } from "expo-router";
import { CalendarRange, FolderKanban, LayoutDashboard, List } from "lucide-react-native";
import { useI18n } from "@/i18n";

export default function TabLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#384959",
        tabBarInactiveTintColor: "#6a89a7",
        tabBarStyle: { backgroundColor: "#e8f3fc", borderTopColor: "#88bdf2" },
      }}
    >
      <Tabs.Screen
        name="projects/index"
        options={{
          title: t("nav.projects"),
          tabBarIcon: ({ color, size }) => <FolderKanban color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t("nav.calendar"),
          tabBarIcon: ({ color, size }) => <CalendarRange color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("nav.dashboard"),
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: t("nav.activities"),
          tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
