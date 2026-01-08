import { useEffect, useState } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

const { width, height } = Dimensions.get("window");
import SplashImage from "../assets/images/splashn.png";


SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
     
      await SplashScreen.hideAsync();

    
      setShowSplash(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <View style={styles.splash}>
        <Image
            source={SplashImage}
            style={{ width: width, height: undefined, aspectRatio: 1242 / 2688 }}
            resizeMode="contain"
          />

      </View>
    );
  }

  return <Redirect href="/signin" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width * 0.5,
    height: height * 0.8,
  },
});
