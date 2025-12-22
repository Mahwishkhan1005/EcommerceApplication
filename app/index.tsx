
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { router } from 'expo-router';
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react"; // Added useEffect
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import './globals.css';

export default function Index() {
  const [loading, setLoading] = useState(true); // Added loading state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = await AsyncStorage.getItem("AccessToken");
        if (token) {
          const decoded: any = jwtDecode(token);
          // Redirect based on role stored in the token
          if (decoded.role === "ROLE_USER") {
            router.replace('/(customer)/home');
          } else {
            router.replace('/(admin)/Admindashboard');
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://192.168.0.200:8083/api/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      if (response.status === 200) {
        await AsyncStorage.setItem("AccessToken", response.data.accessToken);
        const decoded: any = jwtDecode(response.data.accessToken);
        
        if (decoded.role === "ROLE_USER") {
          router.replace('/(customer)/home');
        } else {
          router.replace('/(admin)/Admindashboard');
        }
      } else {
        Alert.alert("Error", "Enter Valid Credentials");
      }
    } catch (error: any) {
      Alert.alert("Error", "Invalid credentials or server error");
    }
  };

  // Show a loading spinner while checking for the token
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#8b008b" />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-blue-500 mb-6">
        Login
      </Text>

      {/* Email */}
      <TextInput
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) =>
          setFormData({ ...formData, email: text })
        }
        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4"
      />

      {/* Password */}
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) =>
          setFormData({ ...formData, password: text })
        }
        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6"
      />

      {/* Login Button */}
      <TouchableOpacity
        onPress={handleLogin}
        className="w-full bg-blue-500 py-3 rounded-lg items-center"
      >
        <Text className="text-white font-semibold text-lg">
          Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}
