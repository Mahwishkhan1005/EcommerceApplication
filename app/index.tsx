// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { BlurView } from "expo-blur";
// import { router } from "expo-router";
// import { jwtDecode } from "jwt-decode";
// import { useState } from "react";
// import {
//   Alert,
//   ImageBackground,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import "./globals.css";

// interface DecodedToken {
//   role: string;
//   [key: string]: any;
// }

// export default function Index() {
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });

//   const handleLogin = async () => {
//     try {
//       const response = await axios.post(
//         "http://192.168.0.246:8080/auth/login",
//         {
//           email: formData.email,
//           password: formData.password,
//         }
//       );

//       if (response.status == 200) {
//         await AsyncStorage.setItem("AccessToken", response.data.accessToken);
//         console.log("Response from Server:", response.data.accessToken);
//         Alert.alert("Success", "Login Successful!");
//         const decoded = jwtDecode<DecodedToken>(response.data.accessToken);
//         console.log("Decoded Token data", decoded.role);
//         if (decoded.role == "ROLE_USER") {
//           router.replace("/(customer)/home");
//         } else {
//           router.replace("/(admin)/Admindashboard");
//         }
//       } else {
//         Alert.alert("Enter Valid Credentials");
//       }
//     } catch (error: any) {
//       console.log(error);
//       Alert.alert("Error", "Invalid credentials or server error");
//     }
//   };

//   return (
//     // <LinearGradient
//     //   colors={['#C391C5', '#8A436A']}
//     //   start={{ x: 0.5, y: 0.5 }}   // center
//     //   end={{ x: 1, y: 1 }}
//     //   className="web:flex-1"
//     // >
//     <ImageBackground
//       source={require("@/assets/images/wallpaper.webp")}
//       resizeMode="cover"
//       className="web:flex-1"
//     >
//       <View className="web:flex-1  items-center justify-center ">
//         <BlurView
//           intensity={50}
//           tint="dark"
//           className="web:w-[90%] max-w-md h-[60%] items-center justify-center bg-white px-6 rounded-3xl"
//         >
//           <Text className="web:text-3xl pb-5 font-bold text-[#212e53]">
//             Login
//           </Text>

//           <TextInput
//             placeholder="Email"
//             placeholderTextColor="#212e53"
//             value={formData.email}
//             onChangeText={(text) => setFormData({ ...formData, email: text })}
//             className="web:w-full text-[#212e53] border-0 bg-[#ffffff5d] rounded-lg px-4 py-3 mb-6"
//           />

//           <TextInput
//             placeholder="Password"
//             placeholderTextColor="#212e53"
//             secureTextEntry
//             value={formData.password}
//             onChangeText={(text) =>
//               setFormData({ ...formData, password: text })
//             }
//             className="web:w-full border-0 bg-[#ffffff5d] rounded-lg px-4 py-3 mb-6"
//           />

//           <TouchableOpacity
//             onPress={handleLogin}
//             className="web:w-full bg-[#212e53] py-3 rounded-lg items-center"
//           >
//             <Text className="web:text-white font-semibold text-lg">Login</Text>
//           </TouchableOpacity>
//         </BlurView>
//       </View>
//       {/* // </LinearGradient> */}
//     </ImageBackground>
//   );
// }

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from "@expo/vector-icons";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";

interface DecodedToken {
  role: string;
  [key: string]: any;
}

export default function Index() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const isWeb = Platform.OS === 'web';

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://192.168.0.246:8080/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      if (response.status === 200) {
        await AsyncStorage.setItem("AccessToken", response.data.accessToken);
        const decoded = jwtDecode<DecodedToken>(response.data.accessToken);
        
        if (decoded.role === "ROLE_USER") {
          router.replace("/(customer)/home");
        } else {
          router.replace("/(admin)/Admindashboard");
        }
      }
    } catch (error: any) {
      console.log("Login Error:", error);
      // Use standard alert for cross-platform
      if (isWeb) {
          window.alert("Login Failed: Please check your credentials.");
      } else {
          Alert.alert("Login Failed", "Please check your credentials.");
      }
    }
  };

  return (
    <LinearGradient
      colors={['#590080', '#FF80BF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 items-center justify-center p-4"
      >
        
        <View className={`items-center ${isWeb ? 'mb-12' : 'mb-8'}`}>
          <View className="bg-white/20 p-5 rounded-full mb-4 shadow-xl">
            <FontAwesome name="truck" size={isWeb ? 60 : 45} color="white" />
          </View>
          <Text className={`${isWeb ? 'text-5xl' : 'text-4xl'} font-bold text-white italic tracking-tighter`}>
            FastDelivery
          </Text>
          {/* <View className="h-1 w-12 bg-white/40 mt-2 rounded-full" /> */}
        </View>

        <View className={`${isWeb ? 'w-[450px]' : 'w-full'} overflow-hidden rounded-[40px] border border-white/20 shadow-xl`}>
          <View
            className="p-8 bg-white/10"
          >
            <Text className="text-3xl italic font-bold text-white mb-8 text-center uppercase tracking-widest">
              Login
            </Text>

            <View className="mb-5">
              <View className="flex-row items-center bg-white/10 rounded-2xl px-4 border border-white/10 focus:border-white/50">
                <FontAwesome name="user" size={18} color="rgba(255,255,255,0.7)" />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  className={`flex-1 text-white px-3 py-4 ${isWeb ? 'outline-none' : ''}`}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="mb-8">
              <View className="flex-row items-center bg-white/10 rounded-2xl px-4 border border-white/10">
                <FontAwesome name="lock" size={18} color="rgba(255,255,255,0.7)" />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  className={`flex-1 text-white px-3 py-4 ${isWeb ? 'outline-none' : ''}`}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.9}
              className="w-2/3 bg-white/80 shadow-xl p-3 ml-16 rounded-2xl items-center mb-4"
            >
              <Text className="text-black font-black text-lg uppercase">Login</Text>
            </TouchableOpacity>

            <View className="flex-row justify-between px-2">
                <TouchableOpacity>
                    <Text className="text-white/60 text-xs font-medium">Forgot Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text className="text-white/60 text-xs font-medium">Register Now</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Branding */}
        {/* <View className="absolute bottom-6 items-center">
            <Text className="text-white/40 text-[10px] font-bold tracking-[2px] uppercase">
                Powered by FastDelivery Tech
            </Text>
        </View> */}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}