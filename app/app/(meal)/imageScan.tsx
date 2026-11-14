import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useState, useContext } from "react";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/auth";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeText } from "@/components";
import { useAppTheme } from "@/lib/theme";
import {
  UploadCloud,
  X,
  // RefreshCw,
  Utensils,
  Zap,
  Droplet,
  Hash,
  PlusCircle,
} from "lucide-react-native";
import { useTranslation } from "@/lib/language";
import ImagePickerModal from "@/components/ui/ImagePickerModal";
import { useStatsStore } from "@/stores/statsStore";

export default function ImageScan() {
  const router = useRouter();
  const { getFoodImage } = useContext(AuthContext);
  const { addScannedFood } = useStatsStore();
  const { t } = useTranslation();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [foodData, setFoodData] = useState<FoodImage | null>(null);

  const { colors } = useAppTheme();

  const requestGalleryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert(t("imageScan.galleryPermissionDenied"));
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert(t("imageScan.cameraPermissionDenied"));
      return false;
    }
    return true;
  };

  const handleImagePicked = (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setFoodData(null);
    }
  };

  const pickImageFromGallery = async () => {
    setModalVisible(false);
    const hasPermission = await requestGalleryPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    console.log("🍎 result", result);
    handleImagePicked(result);
  };

  const takePhotoWithCamera = async () => {
    setModalVisible(false);
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    handleImagePicked(result);
  };

  const handleScanImage = async () => {
    if (!imageUri) {
      alert(t("imageScan.noImageSelected"));
      return;
    }
    setIsLoading(true);
    setFoodData(null);
    try {
      const scannedData = await getFoodImage(imageUri);
      if (scannedData) {
        setFoodData(scannedData as FoodImage);
      } else {
        alert(t("imageScan.noFoodDetected"));
      }
    } catch (error) {
      console.error("Error scanning image:", error);
      alert(t("imageScan.scanError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFoodToStats = async () => {
    if (!foodData) return;
    setIsAddingFood(true);
    try {
      await addScannedFood({
        calories: foodData.calories,
        protein: foodData.protein,
        carbs: foodData.carbs,
        fat: foodData.fat,
      });
      alert(t("imageScan.addedToStatsSuccess"));
    } catch (error) {
      console.error("Error adding food to stats:", error);
      alert(t("imageScan.addedToStatsError"));
    } finally {
      setIsAddingFood(false);
    }
  };

  const clearImage = () => {
    setImageUri(null);
    setFoodData(null);
  };

  const bgColor = "bg-background";
  const cardBgColor = "bg-card";
  const textColorPrimary = "text-foreground";
  const textColorSecondary = "text-muted-foreground";
  const buttonDisabledColor = "bg-muted";

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <View className="flex-row justify-between items-center mb-8">
          <ThemeText className="text-3xl font-bold">
            {t("imageScan.title")}
          </ThemeText>
          <Pressable onPress={() => router.back()} className="p-2">
            <X size={28} color={colors.foreground} />
          </Pressable>
        </View>

        <View className="flex-1 justify-center items-center">
          {!imageUri && !foodData && (
            <Pressable
              onPress={() => setModalVisible(true)}
              className="w-full h-64 border-2 border-dashed border-border rounded-xl justify-center items-center mb-6"
            >
              <UploadCloud size={60} color={colors.subtle} />
              <ThemeText className="mt-4 text-lg text-subtle">
                {t("imageScan.tapToUpload")}
              </ThemeText>
            </Pressable>
          )}

          {imageUri && (
            <View className="items-center w-full mb-6">
              <Image
                source={{ uri: imageUri }}
                className="w-64 h-64 rounded-xl"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={clearImage}
                className={`absolute top-1 right-1 p-2 rounded-full bg-overlay/50`}
              >
                <X size={20} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
          )}

          {isLoading && (
            <View className="my-8 flex-row justify-center items-center">
              <ActivityIndicator size="large" color={colors.foreground} />
              <ThemeText className={`ml-4 text-lg ${textColorPrimary}`}>
                {t("imageScan.loadingText")}
              </ThemeText>
            </View>
          )}

          {foodData && !isLoading && (
            <View
              className={`w-full p-5 rounded-xl ${cardBgColor} shadow-md mb-6`}
            >
              <Text
                className={`text-2xl font-bold mb-4 text-center ${textColorPrimary}`}
              >
                {foodData.food_name}
              </Text>
              <View className="space-y-2">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Zap size={20} color={colors.warning} className="mr-2" />
                    <Text className={`text-base ${textColorSecondary}`}>
                      {t("meal.calories")}:
                    </Text>
                  </View>
                  <Text
                    className={`text-base font-semibold ${textColorPrimary}`}
                  >
                    {foodData.calories} kcal
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Utensils
                      size={20}
                      color={colors.primary}
                      className="mr-2"
                    />
                    <Text className={`text-base ${textColorSecondary}`}>
                      {t("meal.protein")}:
                    </Text>
                  </View>
                  <Text
                    className={`text-base font-semibold ${textColorPrimary}`}
                  >
                    {foodData.protein}g
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Hash size={20} color={colors.primary} className="mr-2" />
                    <Text className={`text-base ${textColorSecondary}`}>
                      {t("meal.carbs")}:
                    </Text>
                  </View>
                  <Text
                    className={`text-base font-semibold ${textColorPrimary}`}
                  >
                    {foodData.carbs}g
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Droplet size={20} color={colors.accent} className="mr-2" />
                    <Text className={`text-base ${textColorSecondary}`}>
                      {t("meal.fat")}:
                    </Text>
                  </View>
                  <Text
                    className={`text-base font-semibold ${textColorPrimary}`}
                  >
                    {foodData.fat}g
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleAddFoodToStats}
                disabled={isAddingFood}
                className={`w-full py-3 rounded-xl mt-6 flex-row justify-center items-center ${
                  isAddingFood ? buttonDisabledColor : "bg-success"
                }`}
              >
                {isAddingFood ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primaryForeground}
                    className="mr-2"
                  />
                ) : (
                  <PlusCircle
                    size={20}
                    color={colors.primaryForeground}
                    className="mr-2"
                  />
                )}
                <Text
                  className={`text-center text-base font-semibold ${
                    isAddingFood
                      ? "text-muted-foreground"
                      : "text-primary-foreground"
                  }`}
                >
                  {isAddingFood
                    ? t("imageScan.addingToStats")
                    : t("imageScan.addToStatsButton")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoading && (
            <View className="w-full mt-auto">
              {imageUri && !foodData && (
                <TouchableOpacity
                  onPress={handleScanImage}
                  className="w-full py-4 rounded-xl mb-3 bg-primary"
                >
                  <Text className="text-primary-foreground text-center text-lg font-semibold">
                    {t("imageScan.scanButton")}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="w-full py-4 rounded-xl bg-muted"
              >
                <Text className="text-foreground text-center text-lg font-semibold">
                  {foodData || imageUri
                    ? t("imageScan.changeImageButton")
                    : t("imageScan.selectImageButton")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <ImagePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onGalleryPress={pickImageFromGallery}
        onCameraPress={takePhotoWithCamera}
      />
    </SafeAreaView>
  );
}
