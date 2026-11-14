import React from "react";
import { Text, Pressable, View } from "react-native";

interface WorkoutListItemProps {
  item: any;
  onPress: () => void;
}

const WorkoutListItem: React.FC<WorkoutListItemProps> = ({ item, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-card border border-border rounded-2xl p-4 mb-3 flex-row justify-between items-center shadow-md"
    >
      <View className="flex-1">
        <Text className="text-lg font-bold text-foreground mb-1">
          {item.name}
        </Text>
        <Text className="text-sm text-subtle">{item.category}</Text>
      </View>
      <View className="bg-muted rounded-lg px-3 py-1.5">
        <Text className="text-sm text-foreground font-semibold">
          {item.duration_minutes} min
        </Text>
      </View>
    </Pressable>
  );
};

export default WorkoutListItem;
