import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [foodInfo, setFoodInfo] = useState<any>(null);
  const [hasShownNotFoundAlert, setHasShownNotFoundAlert] = useState(false); // Шинэ нэмэлт state

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background">
        <Text className="text-subtle" style={styles.message}>
          Камер ашиглах зөвшөөрөл шаардлагатай.
        </Text>
        <Button onPress={requestPermission} title="Зөвшөөрөх" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    setFoodInfo(null);

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${data}.json`,
      );
      const json = await response.json();

      // console.log("Fetched product", json);

      if (json.status === 1 && json.product) {
        setFoodInfo(json.product);
        setHasShownNotFoundAlert(false); // Шинэ бүтээгдэхүүн олдсон тул alert-г дахин харуулах боломж нээх
      } else {
        if (!hasShownNotFoundAlert) {
          alert("Бүтээгдэхүүн олдсонгүй!");
          setHasShownNotFoundAlert(true); // Alert нэг удаа гарсан гэж тэмдэглэх
        }
        setFoodInfo(null);
        setScanned(false);
      }
    } catch (err) {
      console.log("Error fetching product", err);
      alert("Алдаа гарлаа. Сүлжээг шалгана уу.");
      setScanned(false);
    }
  }

  function getLevel(value: number, type: string) {
    if (type === "fat") {
      if (value < 3) return "бага";
      if (value < 17.5) return "дунд";
      return "өндөр";
    }
    if (type === "saturated-fat") {
      if (value < 1.5) return "бага";
      if (value < 5) return "дунд";
      return "өндөр";
    }
    if (type === "sugars") {
      if (value < 5) return "бага";
      if (value < 22.5) return "дунд";
      return "өндөр";
    }
    if (type === "salt") {
      if (value < 0.3) return "бага";
      if (value < 1.5) return "дунд";
      return "өндөр";
    }
    return "мэдэгдэхгүй";
  }

  return (
    <View className="flex-1 bg-background">
      {!foodInfo ? (
        <CameraView
          style={styles.camera}
          facing={facing}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={toggleCameraFacing}
            >
              <Text style={styles.text}>Камер эргүүлэх</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <ScrollView
          className="bg-background"
          contentContainerStyle={styles.infoContainer}
        >
          <Text className="text-foreground" style={styles.title}>
            {foodInfo.product_name || "Нэргүй бүтээгдэхүүн"}
          </Text>

          <View className="bg-muted" style={styles.card}>
            <Text className="text-foreground" style={styles.label}>
              🍽 Ангилал:
            </Text>
            <Text className="text-foreground" style={styles.value}>
              {foodInfo.categories || "Мэдээлэл байхгүй"}
            </Text>
          </View>

          <View className="bg-muted" style={styles.card}>
            <Text className="text-foreground" style={styles.label}>
              📊Шим тэжээлийн мэдээлэл:
            </Text>
            <Text className="text-foreground" style={styles.value}>
              Илчлэг:{" "}
              {Math.round(foodInfo.nutriments?.["energy-kcal"] * 100) / 100 ||
                "?"}{" "}
              kcal
            </Text>
            <Text className="text-foreground" style={styles.value}>
              Нүүрс ус:{" "}
              {Math.round(foodInfo.nutriments?.carbohydrates * 100) / 100 ||
                "?"}{" "}
              г
            </Text>
            <Text className="text-foreground" style={styles.value}>
              Өөх тос: {Math.round(foodInfo.nutriments?.fat * 100) / 100 || "?"}{" "}
              г
            </Text>
            <Text className="text-foreground" style={styles.value}>
              ‣ Ханасан тос:{" "}
              {Math.round(foodInfo.nutriments?.["saturated-fat"] * 100) / 100 ||
                "?"}{" "}
              г
            </Text>
            <Text className="text-foreground" style={styles.value}>
              Уураг:{" "}
              {Math.round(foodInfo.nutriments?.proteins * 100) / 100 || "?"} г
            </Text>
            <Text className="text-foreground" style={styles.value}>
              Давс: {Math.round(foodInfo.nutriments?.salt * 100) / 100 || "?"} г
            </Text>
            <Text className="text-foreground" style={styles.value}>
              Сахар:{" "}
              {Math.round(foodInfo.nutriments?.sugars * 100) / 100 || "?"} г
            </Text>
          </View>

          <View className="bg-muted" style={styles.card}>
            <Text className="text-foreground" style={styles.label}>
              🟢 Тэжээлийн чанарын үнэлгээ:
            </Text>
            <Text
              className="text-foreground"
              style={[styles.value, { fontWeight: "bold", fontSize: 18 }]}
            >
              {foodInfo.nutriscore_grade?.toUpperCase() || "?"}
            </Text>
          </View>

          <View className="bg-muted" style={styles.card}>
            <Text className="text-foreground" style={styles.label}>
              🧂 Тэжээлийн түвшин:
            </Text>
            <Text className="text-foreground" style={styles.value}>
              Өөх тос: {getLevel(foodInfo.nutriments?.fat_100g || 0, "fat")}
            </Text>
            <Text className="text-foreground" style={styles.value}>
              Ханасан тос:{" "}
              {getLevel(
                foodInfo.nutriments?.["saturated-fat_100g"] || 0,
                "saturated-fat",
              )}
            </Text>
            <Text className="text-foreground" style={styles.value}>
              Сахар: {getLevel(foodInfo.nutriments?.sugars_100g || 0, "sugars")}
            </Text>
            <Text className="text-foreground" style={styles.value}>
              Давс: {getLevel(foodInfo.nutriments?.salt_100g || 0, "salt")}
            </Text>
          </View>

          <Button
            title="Буцах"
            onPress={() => {
              setFoodInfo(null);
              setScanned(false);
              setHasShownNotFoundAlert(false); // Alert дахин харуулах боломжийг нээх
            }}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    textAlign: "center",
    padding: 10,
    fontSize: 16,
  },
  camera: { flex: 1 },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
  },
  text: { fontSize: 20, fontWeight: "bold", color: "white" },
  infoContainer: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  card: {
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  value: {
    fontSize: 15,
    marginBottom: 3,
  },
});
