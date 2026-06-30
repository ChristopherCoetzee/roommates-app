import { config } from "@gluestack-ui/config";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { Stack } from "expo-router";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { TasksProvider } from "@/store/tasks";

export default function RootLayout() {
  return (
    <GluestackUIProvider config={config}>
      <TasksProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <AnimatedSplashOverlay />
      </TasksProvider>
    </GluestackUIProvider>
  );
}
