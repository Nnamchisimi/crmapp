import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@/app/context/AuthContext";

import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();




const BASE_URL = "http://192.168.55.73:3007";  




const GOOGLE_WEB_CLIENT_ID =
  "1077024630815-irm5k01nll1ng6begm467k29fvdfhr5h.apps.googleusercontent.com";


const GOOGLE_ANDROID_CLIENT_ID = undefined;
const GOOGLE_IOS_CLIENT_ID = undefined;

interface SignInResponse {
  success: boolean;
  message?: string;
  email?: string;
  role?: string;
  token?: string;
  name?: string;
  surname?: string;
}

export default function SignIn() {


const { setAuthData } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ----------------------
  // Google Auth Hook (INSIDE component)
  // ----------------------
  //const [request, response, promptAsync] = Google.useAuthRequest({
   // webClientId: GOOGLE_WEB_CLIENT_ID,
    //androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    //iosClientId: GOOGLE_IOS_CLIENT_ID,
  //});

  // ----------------------
  // Handle Google Response
  // ----------------------
 /* useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken;
      if (idToken) {
        handleGoogleLogin(idToken);
      }
    }
  }, [response]);
*/

  // Email / Password Login

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: SignInResponse = await res.json();

      if (!data.success || !data.token) {
        Alert.alert("Sign in failed", data.message ?? "Unknown error");
        return;
      }

          await AsyncStorage.multiSet([
          ["token", data.token],
          ["userEmail", data.email ?? ""],
          ["userName", data.name ?? ""],
        ]);

      
        setAuthData(
          data.token,
          data.email ?? null,
          data.name ?? null
        );




      router.replace(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  

  const handleGoogleLogin = async (idToken: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      });

      const data: SignInResponse = await res.json();

      if (!data.success || !data.token) {
        Alert.alert("Google sign-in failed");
        return;
      }

      await AsyncStorage.multiSet([
        ["token", data.token],
        ["userEmail", data.email ?? ""],
        ["role", data.role ?? ""],
      ]);

      router.replace("/dashboard");
    } catch {
      Alert.alert("Google sign-in error");
    }
  };


 

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Sign In</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Signing in..." : "Sign In"}
          </Text>
        </TouchableOpacity>

       {/* <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          disabled={!request}
          onPress={() => promptAsync()}
        >
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
        */}
        <View style={styles.links}>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.linkText}>Create account</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/adminsignin")}>
            <Text style={styles.linkText}>Admin sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}


// Styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    marginBottom: 14,
  },
  button: {
    backgroundColor: "#00bcd4",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  googleButton: {
    backgroundColor: "#fff",
  },
  googleText: {
    color: "#000",
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  links: {
    marginTop: 20,
    alignItems: "center",
    gap: 12,
  },
  linkText: {
    color: "#00bcd4",
    fontSize: 14,
  },
});
