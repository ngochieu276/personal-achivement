import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/auth";

export default function AuthLayout() {
  const token = useAuthStore((state) => state.token);
  if (token) return <Redirect href="/projects" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#e6f0f9" } }} />;
}
