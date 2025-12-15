import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { router } from 'expo-router';
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import './globals.css';

export default function Index() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://192.168.0.246:8080/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
       
      );


            if(response.status==200){
                await AsyncStorage.setItem("AccessToken",response.data.accessToken)
      console.log("Response from Server:", response.data.accessToken);
      Alert.alert("Success", "Login Successful!");
      const decoded = jwtDecode(response.data.accessToken);
      console.log("Decoded Token data",decoded.role);
      if(decoded.role=="ROLE_USER"){
            router.replace('/(customer)/home')
      }else{
        router.replace('/(admin)/Admindashboard')
      }
            }else{
              Alert.alert("Enter Valid Credentials");
            }

       
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", "Invalid credentials or server error");
    }
  };

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
