// import { FontAwesome } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { router } from "expo-router";
// import { jwtDecode } from "jwt-decode";
// import { useState } from "react";
// import {
//   Alert,
//   ImageBackground,
//   KeyboardAvoidingView,
//   Platform,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// interface DecodedToken {
//   role: string;
//   [key: string]: any;
// }

// export default function Index() {
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });

//   const isWeb = Platform.OS === "web";

//   const handleLogin = async () => {
//     try {
//       const response = await axios.post(
//         "http://192.168.0.219:8083/api/auth/login",
//         {
//           email: formData.email,
//           password: formData.password,
//         }
//       );

//       if (response.status === 200) {
//         await AsyncStorage.setItem("AccessToken", response.data.accessToken);
//         const decoded = jwtDecode<DecodedToken>(response.data.accessToken);

//         if (decoded.role === "ROLE_USER") {
//           router.replace("/(customer)/home");
//         } else {
//           router.replace("/(admin)/Admindashboard");
//         }
//       }
//     } catch (error: any) {
//       console.log("Login Error:", error);
//       // Use standard alert for cross-platform
//       if (isWeb) {
//         window.alert("Login Failed: Please check your credentials.");
//       } else {
//         Alert.alert("Login Failed", "Please check your credentials.");
//       }
//     }
//   };

//   return (
//     // <LinearGradient
//     //   colors={["#590080", "#FF80BF"]}
//     //   start={{ x: 0, y: 0 }}
//     //   end={{ x: 1, y: 1 }}
//     //   className="flex-1"
//     // >
//     <ImageBackground
//       // For a local image: source={require("./assets/bg-image.jpg")}
//       // For a remote image:
//       source={{
//         // uri: "https://img.goodfon.com/wallpaper/nbig/4/c6/landscape-night-mountain-view-purple-background-pink-backgro.webp",
//         uri: "https://img.goodfon.com/wallpaper/nbig/e/d6/iaponiia-fudziiama-gora-vulkan-ostrov-khonsiu-sirenevyi-sire.webp",
//       }}
//       resizeMode="cover"
//       className="flex-1"
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         className="flex-1 items-center justify-center p-4"
//       >
//         <View className={`items-center ${isWeb ? "mb-12" : "mb-8"}`}>
//           <View className="bg-white/20 p-5 rounded-full mb-4 shadow-xl">
//             <FontAwesome name="truck" size={isWeb ? 60 : 45} color="white" />
//           </View>
//           <Text
//             className={`${isWeb ? "text-5xl" : "text-4xl"} font-bold text-white italic tracking-tighter`}
//           >
//             FastDelivery
//           </Text>
//         </View>

//         <View
//           className={`${isWeb ? "w-[450px]" : "w-[300px]"} overflow-hidden rounded-[40px] border border-white/30 shadow-xl`}
//         >
//           <View className="p-8 bg-white/20">
//             <Text className="text-3xl italic font-bold text-white mb-8 text-center uppercase tracking-widest">
//               Login
//             </Text>

//             <View className="mb-5">
//               <View className="flex-row items-center bg-white/10 rounded-2xl px-4 border border-white/10 focus:border-white/50">
//                 <FontAwesome
//                   name="user"
//                   size={18}
//                   color="rgba(255,255,255,0.7)"
//                 />
//                 <TextInput
//                   placeholder="Email"
//                   placeholderTextColor="rgba(255,255,255,0.5)"
//                   value={formData.email}
//                   onChangeText={(text) =>
//                     setFormData({ ...formData, email: text })
//                   }
//                   className={`flex-1 text-white px-3 py-4 ${isWeb ? "outline-none" : ""}`}
//                   keyboardType="email-address"
//                   autoCapitalize="none"
//                 />
//               </View>
//             </View>

//             <View className="mb-8">
//               <View className="flex-row items-center bg-white/10 rounded-2xl px-4 border border-white/10">
//                 <FontAwesome
//                   name="lock"
//                   size={18}
//                   color="rgba(255,255,255,0.7)"
//                 />
//                 <TextInput
//                   placeholder="Password"
//                   placeholderTextColor="rgba(255,255,255,0.5)"
//                   secureTextEntry
//                   value={formData.password}
//                   onChangeText={(text) =>
//                     setFormData({ ...formData, password: text })
//                   }
//                   className={`flex-1 text-white px-3 py-4 ${isWeb ? "outline-none" : ""}`}
//                 />
//               </View>
//             </View>

//             <TouchableOpacity
//               onPress={handleLogin}
//               activeOpacity={0.9}
//               className="w-2/3 bg-white shadow-xl p-3 ml-16 rounded-2xl items-center mb-4"
//             >
//               <Text className="text-black font-black text-lg uppercase">
//                 Login
//               </Text>
//             </TouchableOpacity>

//             <View className="flex-row justify-between px-2">
//               <TouchableOpacity>
//                 <Text className="text-white/60 text-xs font-medium">
//                   Forgot Password?
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity>
//                 <Text className="text-white/60 text-xs font-medium">
//                   Register Now
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>

//         {/* Footer Branding */}
//         {/* <View className="absolute bottom-6 items-center">
//           <Text className="text-white/40 text-[10px] font-bold tracking-[2px] uppercase">
//             Powered by FastDelivery Tech
//           </Text>
//         </View> */}
//       </KeyboardAvoidingView>
//       {/* </LinearGradient> */}
//     </ImageBackground>
//   );
// }

import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface DecodedToken {
  role: string;
  [key: string]: any;
}

export default function Index() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(true);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("AccessToken");
      if (token) {
        const decoded = jwtDecode<DecodedToken>(token);
        redirectUser(decoded.role);
      }
    } catch (e) {
      console.log("Error checking login status", e);
    } finally {
      setIsLoading(false);
    }
  };

  const redirectUser = (role: string) => {
    if (role === "ROLE_USER") {
      router.replace("/(customer)/home");
    } else {
      router.replace("/(admin)/Admindashboard");
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://192.168.0.225:8083/api/auth/login",
        { email: formData.email, password: formData.password }
      );

      if (response.status === 200) {
        await AsyncStorage.setItem("AccessToken", response.data.accessToken);
        const decoded = jwtDecode<DecodedToken>(response.data.accessToken);
        redirectUser(decoded.role);
      }
    } catch (error: any) {
      if (isWeb) {
        window.alert("Login Failed: Please check your credentials.");
      } else {
        Alert.alert("Login Failed", "Please check your credentials.");
      }
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <ImageBackground
      source={{
        // uri: "https://img.goodfon.com/wallpaper/nbig/4/c6/landscape-night-mountain-view-purple-background-pink-backgro.webp",
        uri: "https://img.goodfon.com/wallpaper/nbig/e/d6/iaponiia-fudziiama-gora-vulkan-ostrov-khonsiu-sirenevyi-sire.webp",
      }}
      resizeMode="cover"
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 items-center justify-center p-4"
      >
        <View className={`items-center ${isWeb ? "mb-12" : "mb-8"}`}>
          <View className="bg-white/20 p-5 rounded-full mb-4 shadow-xl">
            <FontAwesome name="truck" size={isWeb ? 60 : 45} color="white" />
          </View>
          <Text
            className={`${isWeb ? "text-5xl" : "text-4xl"} font-bold text-white italic tracking-tighter`}
          >
            Dailydrop
          </Text>
        </View>

        <View
          className={`${isWeb ? "w-[450px]" : "w-[300px]"} overflow-hidden rounded-[40px] border border-white/20 shadow-xl`}
        >
          <View className="p-8 bg-white/10">
            <Text className="text-3xl italic font-bold text-white mb-8 text-center uppercase tracking-widest">
              Login
            </Text>

            <View className="mb-5">
              <View className="flex-row items-center bg-white/10 rounded-2xl px-4 border border-white/10">
                <FontAwesome
                  name="user"
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  className={`flex-1 text-white px-3 py-4 ${isWeb ? "outline-none" : ""}`}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="mb-8">
              <View className="flex-row items-center bg-white/10 rounded-2xl px-4 border border-white/10">
                <FontAwesome
                  name="lock"
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  className={`flex-1 text-white px-3 py-4 ${isWeb ? "outline-none" : ""}`}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.9}
              className="w-2/3 bg-white/80 shadow-xl p-3 ml-12 rounded-2xl items-center mb-4"
            >
              <Text className="text-black font-black text-lg uppercase">
                Login
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-between px-2">
              <TouchableOpacity>
                <Text className="text-white/60 text-xs font-medium">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text className="text-white/60 text-xs font-medium">
                  Register Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
    // {/* </LinearGradient> */}
  );
}
