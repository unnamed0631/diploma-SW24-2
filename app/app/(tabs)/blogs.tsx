import {
  TextInput,
  Pressable,
  View,
  Text,
  FlatList,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { use, useEffect, useMemo, useState } from "react";
import { useBlogStore } from "@/stores/blogStore";
import PostCard from "@/components/PostCard";
import { Search, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ThemeView } from "@/components";
import { useTranslation } from "@/lib/language";
import { AuthContext } from "@/context/auth";
import { useAppTheme } from "@/lib/theme";

export default function FeedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = use(AuthContext);
  const { posts, setUser, loadPosts, loadingPosts } = useBlogStore();
  const { colors } = useAppTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPosts();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      setUser(user);
      loadPosts();
    }
  }, [user, setUser, loadPosts]);

  const trimmedQuery = query.trim();
  const filteredPosts = useMemo(() => {
    const search = trimmedQuery.toLowerCase();
    if (!search) return posts;

    return posts.filter((post) => {
      const title = post.title?.toLowerCase() ?? "";
      const content = post.content?.toLowerCase() ?? "";
      const username = post.author?.username?.toLowerCase() ?? "";
      return (
        title.includes(search) ||
        content.includes(search) ||
        username.includes(search)
      );
    });
  }, [posts, trimmedQuery]);

  if (!user) {
    return (
      <View
        className="flex-1 bg-background justify-center items-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-subtle font-medium text-lg">
          {t("post.notpost")}
        </Text>
        <Text className="text-subtle text-center mt-2 px-10">
          {t("post.create")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ThemeView className="flex-1 p-6 pt-0">
        <Text className="text-2xl font-bold mb-6 text-foreground  ">
          {t("post.title")}
        </Text>
        <View className="flex-row items-center gap-3 mb-4">
          <View
            className={`flex-row flex-1 justify-start items-center border-border rounded-full p-2 h-14 pl-3 gap-2 border-2 ${
              isFocused ? "border-blue-200" : "border-border"
            }`}
          >
            <Search size={18} color={colors.subtle} />
            <TextInput
              placeholder={t("post.search")}
              placeholderTextColor={colors.subtle}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              className="flex-1 text-foreground"
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery("")}
                accessibilityLabel="Clear search"
                className="pr-2"
              >
                <X size={18} color={colors.subtle} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => router.push("/(blog)/create")}
            accessibilityLabel={t("post.create")}
            className="w-14 h-14 bg-primary rounded-full justify-center items-center"
          >
            <Feather name="plus" size={24} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          className="mt-6"
          refreshControl={
            <RefreshControl
              refreshing={refreshing || loadingPosts}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
          ListEmptyComponent={
            trimmedQuery ? (
              <View
                className="flex-1 justify-center items-center"
                style={{ paddingTop: insets.top }}
              >
                <Text className="text-subtle font-medium text-lg text-center px-10">
                  No results for “{trimmedQuery}”
                </Text>
                <Text className="text-subtle text-center mt-2 px-10">
                  Try a different title, author or keyword.
                </Text>
                <Pressable onPress={() => setQuery("")} className="mt-4">
                  <Text className="text-primary font-medium">Clear search</Text>
                </Pressable>
              </View>
            ) : (
              <View
                className="flex-1 justify-center items-center"
                style={{ paddingTop: insets.top }}
              >
                <Text className="text-subtle font-medium text-lg">
                  No posts yet
                </Text>
                <Text className="text-subtle text-center mt-2 px-10">
                  Create a new post or wait for others to share their thoughts
                </Text>
              </View>
            )
          }
        />
      </ThemeView>
    </SafeAreaView>
  );
}
