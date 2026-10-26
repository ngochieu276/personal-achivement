import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/auth";

export default function AppLayout() {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Redirect href="/login" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#e6f0f9" } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="archived" />
      <Stack.Screen name="projects/[id]" />
      <Stack.Screen name="groups/[id]" />
      <Stack.Screen name="subjects/[id]/index" />
      <Stack.Screen name="subjects/[id]/timeline" />
    </Stack>
  );
}
