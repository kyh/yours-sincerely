import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "@/lib/css-interop";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { themes, useTheme } from "@/components/theme-provider";

/** Dev screen: verifies every theme's tokens render correctly on native. */
export default function ThemeGallery() {
  const { theme, setTheme } = useTheme();

  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Text className="text-2xl font-bold">Theme gallery</Text>

        <View className="flex-row flex-wrap gap-2">
          {themes.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: theme === option.id }}
              onPress={() => setTheme(option.id)}
              className={
                theme === option.id
                  ? "border-ring rounded-full border-2 p-1"
                  : "rounded-full border-2 border-transparent p-1"
              }
            >
              <View
                className="border-border size-8 rounded-full border"
                style={{ backgroundColor: option.color }}
              />
            </Pressable>
          ))}
        </View>
        <Text className="text-muted-foreground text-sm">Active: {theme}</Text>

        <Card>
          <Text className="text-lg font-semibold">A tiny beautiful letter</Text>
          <Text className="text-muted-foreground">
            This is what a card looks like — muted text on the card surface.
          </Text>
          <View className="flex-row gap-2">
            <Button>Publish</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </View>
          <View className="flex-row gap-2">
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Delete</Button>
            <Button loading>Loading</Button>
          </View>
        </Card>

        <Input placeholder="Write a little love letter..." />

        <View className="flex-row items-center gap-3">
          <Spinner />
          <Text className="font-sans">Regular 400</Text>
          <Text className="font-medium">Medium 500</Text>
          <Text className="font-bold">Bold 700</Text>
        </View>

        <View className="bg-primary rounded-radius p-3">
          <Text className="text-primary-foreground text-center font-medium">
            Primary surface
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
