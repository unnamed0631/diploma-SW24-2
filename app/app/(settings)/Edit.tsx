import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useState, use } from "react";
import { useNavigation, useRouter } from "expo-router";
import { ThemeView, ThemeText, Avatar } from "@/components";
import { useAppTheme } from "@/lib/theme";
import { Icon } from "react-native-paper";
import { AuthContext } from "@/context/auth";
import * as ImagePicker from "expo-image-picker";
import ImagePickerModal from "@/components/ui/ImagePickerModal";
import { Camera } from "expo-camera";

export default function Edit() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, isUpdating, update } = use(AuthContext);

  const [name, setName] = useState(user?.username || "");
  const [image, setImage] = useState<string | null>(user?.image || null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const saveDisabled =
    (name === "" || name === user?.username) && image === user?.image;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.push("/");
    }
  };

  const handleSave = async () => {
    console.log("saving");
    const updatedData: Record<string, any> = {};

    if (image !== user?.image) {
      updatedData.image = image;
    }

    if (name !== user?.username) {
      updatedData.username = name;
    }

    if (Object.keys(updatedData).length > 0) {
      const success: boolean = await update(updatedData);
      if (success) {
        router.replace("/(tabs)/(profile)/profile");
      }
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === "granted";
  };

  const handleCameraPress = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setShowImagePicker(false);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleGalleryPress = async () => {
    setShowImagePicker(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const isDisabled = saveDisabled || isUpdating;

  return (
    <ThemeView className="pt-4 px-8 flex-1 justify-between">
      <View>
        {/* Header */}
        <View className="flex-row items-center justify-between w-full">
          <View className="border-2 border-border rounded-full">
            <Pressable
              android_disableSound
              android_ripple={{
                color: colors.subtle,
                radius: 20,
              }}
              className="p-2"
              onPress={handleBack}
            >
              <Icon source="chevron-left" size={25} color={colors.foreground} />
            </Pressable>
          </View>
          <ThemeText className="text-2xl text-center font-semibold">
            Edit
          </ThemeText>
          <Pressable
            className="border-2 border-border p-2 rounded-full"
            onPress={handleBack}
          >
            <Icon source="cog-outline" size={25} color={colors.foreground} />
          </Pressable>
        </View>
        {/* Profile image */}
        <Text className="mt-8 text-lg text-subtle">Profile picture</Text>
        <View className="flex-row justify-center relative mt-4">
          <Pressable
            className="relative p-2"
            onPress={() => setShowImagePicker(true)}
          >
            <Avatar size={120} image={image} />
            <View className="border-2 border-background bg-foreground p-2 rounded-full absolute z-10 right-0 bottom-0">
              <Icon source="pencil" size={20} color={colors.background} />
            </View>
          </Pressable>
        </View>

        {/* Name */}
        <Text className="mt-8 text-lg text-subtle">Username</Text>
        <TextInput
          className="border border-border px-8 py-4 rounded-full text-foreground mt-4"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          style={{ fontSize: 18 }}
          aria-disabled={isDisabled}
        />
      </View>

      {/* Save button */}
      <Pressable
        onPress={handleSave}
        disabled={isDisabled}
        className={`bg-primary py-4 rounded-full mb-20 ${
          isDisabled ? "opacity-50" : ""
        }`}
      >
        {isUpdating ? (
          <ActivityIndicator color={colors.primaryForeground} size="small" />
        ) : (
          <Text className="text-primary-foreground text-center text-xl font-semibold">
            Save
          </Text>
        )}
      </Pressable>

      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
      />
    </ThemeView>
  );
}
