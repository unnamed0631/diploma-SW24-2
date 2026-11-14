import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ImagePickerModal from "@/components/ui/ImagePickerModal";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ThemeView } from "@/components";
import { useAppTheme } from "@/lib/theme";
import { useBlogStore } from "@/stores/blogStore";
import { useTranslation } from "@/lib/language";

export default function Create() {
  const { colors } = useAppTheme();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageVisible, setImageVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addPost } = useBlogStore();
  const { t } = useTranslation();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    const res = await addPost({
      title,
      content,
      image: imageUrl,
    });

    if (res) {
      router.replace("/(tabs)/blogs");
    }
  };

  const isSubmitDisabled = !title.trim() || !content.trim();

  const handleCameraPress = async () => {
    setImageVisible(false);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleGalleryPress = async () => {
    setImageVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
    }
  };

  return (
    <ThemeView style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between p-4 border-b border-border">
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">
          {t("post.create")}
        </Text>
        <Pressable
          className={`py-2 px-4 rounded-full ${
            isSubmitDisabled ? "bg-muted" : "bg-primary"
          }`}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
        >
          <Text
            className={`${
              isSubmitDisabled ? "text-subtle" : "text-primary-foreground"
            } font-medium`}
          >
            {t("post.button")}
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        <TextInput
          className="text-xl font-bold text-foreground mb-4"
          placeholder="Title"
          placeholderTextColor={colors.subtle}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          multiline
        />

        <TextInput
          className="text-base text-muted-foreground min-h-40"
          placeholder="What's on your mind?"
          placeholderTextColor={colors.subtle}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {imageUrl ? (
          <View className="mt-4 rounded-lg overflow-hidden relative">
            <Image
              source={{ uri: imageUrl }}
              className="w-full aspect-video rounded-lg"
              resizeMode="cover"
            />
            <Pressable
              className="absolute top-2 right-2 bg-overlay/50 rounded-full p-1"
              onPress={() => setImageUrl("")}
            >
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            className="mt-4 border-2 border-dashed border-border rounded-lg p-6 items-center"
            onPress={() => {
              setImageVisible(true);
            }}
          >
            <Feather name="plus" size={32} color={colors.subtle} />
            <Text className="mt-2 text-subtle">{t("post.image")}</Text>
          </Pressable>
        )}
      </ScrollView>
      <ImagePickerModal
        visible={imageVisible}
        onClose={() => setImageVisible(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
      />
    </ThemeView>
  );
}
