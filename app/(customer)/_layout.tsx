// import { Ionicons } from "@expo/vector-icons";
// import { Stack, Tabs } from "expo-router";
// import React, { useEffect, useRef } from "react";
// import { Animated, Text, View } from "react-native";
// import {LinearGradient} from 'expo-linear-gradient'

// const AnimatedIcon = ({
//   focused,
//   name,
//   size,
//   color,
//   label,
// }: {
//   focused: boolean;
//   name: React.ComponentProps<typeof Ionicons>["name"];
//   size: number;
//   color: string;
//   label: string;
// }) => {
//   const scaleAnim = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     const scaleTo = focused ? 1.2 : 1;
//     const duration = 200;

//     Animated.timing(scaleAnim, {
//       toValue: scaleTo,
//       duration: duration,
//       useNativeDriver: true,
//     }).start();
//   }, [focused, scaleAnim]);

//   return (
//     <Animated.View
//       style={{
//         transform: [{ scale: scaleAnim }],
//         width: 100,
//         alignItems: "center",
//         borderColor: "#212e53",
//       }}
//     >
//       <Ionicons className="web:mt-4" name={name} size={size} color={color} />
//       <Text
//         className={`text-[11px] mb-4  ${
//           focused ? "web:text-[#fff] font-bold" : "web:text-white"
//         }`}
//       >
//         {label}
//       </Text>
//     </Animated.View>
//   );
// };

// const Customerlayout = () => {
//   <Stack
//     screenOptions={{
//       headerShown: false,
//     }}
//   />;

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarShowLabel: false,

//         tabBarStyle: {
//           position: "absolute",
//           backgroundColor: "transparent",
//           borderTopWidth: 0,
//           elevation: 0,
//         },
//         tabBarItemStyle: {
//           width: 200,
//         },
//         tabBarBackground: () => (
//           <LinearGradient
//   colors={[
//     'rgba(89, 0, 128, 0.96)',
//     'rgba(255, 128, 191, 0.95)',
//   ]}
//   start={{ x: 0, y: 0 }}
//   end={{ x: 1, y: 0 }}   // 90deg
//   style={{ borderTopLeftRadius:50,borderTopRightRadius:50,shadow:"lg" }}
// >

//           <View className="web: mb-4 py-10 h-[100px] rounded-full shadow-lg" />
//           </LinearGradient>
//         ),
//       }}
//     >
//       <Tabs.Screen
//         name="home"
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <AnimatedIcon
//               focused={focused}
//               name={focused ? "home" : "home-outline"}
//               size={22}
//               color={focused ? "#fff" : "#fff"}
//               label="Home"
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="wishlist"
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <AnimatedIcon
//               focused={focused}
//               name={focused ? "heart" : "heart-outline"}
//               size={22}
//               color={focused ? "#fff" : "#fff"}
//               label="Wish List"
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="cart"
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <AnimatedIcon
//               focused={focused}
//               name={focused ? "cart" : "cart-outline"}
//               size={22}
//               color={focused ? "#fff" : "#fff"}
//               label="Cart"
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="profile"
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <AnimatedIcon
//               focused={focused}
//               name={focused ? "person" : "person-outline"}
//               size={22}
//               color={focused ? "#fff" : "#fff"}
//               label="Profile"
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// };

// export default Customerlayout;

// import { Ionicons } from '@expo/vector-icons';
// import { Stack, Tabs } from 'expo-router';
// import React, { useEffect, useRef } from 'react';
// import { Animated, StyleSheet, Text, View } from 'react-native';
//  // <-- Added StyleSheet

//  const AnimatedBackgroundIcon = ({ focused, name, size, color, activeColor, inactiveColor, label }: { focused: boolean; name: string; size: number; color?: string; activeColor: string; inactiveColor: string; label: string }) => {
//   const iconScaleAnim = useRef(new Animated.Value(1)).current;
//   const bgScaleAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.timing(iconScaleAnim, {
//       toValue: focused ? 1.1 : 1,
//       duration: 200,
//       useNativeDriver: true,
//     }).start();

//     Animated.timing(bgScaleAnim, {
//       toValue: focused ? 1 : 0,
//       duration: 250,
//       useNativeDriver: true,
//     }).start();
//   }, [focused]);

//   const iconColor = focused ? '#fff' : inactiveColor;

//   return (
//     <View style={{ alignItems: 'center' }}>
//       <Animated.View
//         style={{
//           width: 55,
//           height: 55,
//           borderRadius: 50,
//           backgroundColor: activeColor,
//           transform: [{ scale: bgScaleAnim }],
//           position: 'absolute',
//         }}
//       />
//       <Animated.View style={{ transform: [{ scale: iconScaleAnim },],padding:5, }}>
//         <Ionicons name={name} size={size} color={iconColor} />
//       </Animated.View>
//       <Text style={{ fontSize: 10,fontWeight:500, color: focused ? '#fff' : inactiveColor,}}>
//         {label}
//       </Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   backgroundCircle: {
//     position: 'absolute',
//     width: 50,
//     height: 50,
//     borderRadius: 50,
//   },
//   iconOverlay: {
//     zIndex: 10,
//   },
// });

// const Customerlayout = () => {
//   const ACTIVE_COLOR = '#fff';
//   const INACTIVE_COLOR = '#9ca3af';
//   const BG_COLOR = '#041d54';

//   <Stack
//       screenOptions={{
//         headerShown: false,
//       }}
//     />

//   return (
//     <Tabs
//       screenOptions={{
//         headerShown: false,
//         tabBarShowLabel: false,

//         tabBarStyle: {
//           height:70,
//           position: 'absolute',
//           backgroundColor: 'transparent',
//           borderTopWidth: 0,
//           elevation: 0,
//         },

//         tabBarBackground: () => (
//           <View className="mx-4 mb-3 h-[70px] rounded-full bg-[#fff] shadow-lg" />
//         ),
//       }}
//     >
//       <Tabs.Screen
//         name="home"
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <AnimatedBackgroundIcon
//               focused={focused}
//               name={focused ? 'home' : 'home-outline'}
//               size={24}
//               activeColor={BG_COLOR}
//               inactiveColor={INACTIVE_COLOR}
//               label='Home'
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="wishlist"
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <AnimatedBackgroundIcon
//               focused={focused}
//               name={focused ? 'heart' : 'heart-outline'}
//               size={24}
//               activeColor={BG_COLOR}
//               inactiveColor={INACTIVE_COLOR}
//               label='Wishlist'
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="cart"
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <AnimatedBackgroundIcon
//               focused={focused}
//               name={focused ? 'cart' : 'cart-outline'}
//               size={24}
//               activeColor={BG_COLOR}
//               inactiveColor={INACTIVE_COLOR}
//               label='cart'
//             />
//           ),
//         }}
//       />

//       <Tabs.Screen
//         name="profile"
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <AnimatedBackgroundIcon
//               focused={focused}
//               name={focused ? 'person' : 'person-outline'}
//               size={24}
//               activeColor={BG_COLOR}
//               inactiveColor={INACTIVE_COLOR}
//               label='profile'
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// };

// export default Customerlayout;

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, Text, View } from "react-native";

const isWeb = Platform.OS === 'web';

const AnimatedIcon = ({
  focused,
  name,
  size,
  color,
  label,
}: {
  focused: boolean;
  name: React.ComponentProps<typeof Ionicons>["name"];
  size: number;
  color: string;
  label: string;
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Parallel animation for a smooth "lift and scale" transform
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.2 : 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: focused ? -4 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start();
  }, [focused]);

  return (
    <View className="items-center justify-center w-20">
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim }
          ],
          // borderRadius:50,
          // borderWidth:1,
          // padding:5,
          // borderColor:"#fff"
        }}
        className="items-center justify-center"
      >
        
        <Ionicons name={name} size={size} color={color} className="px-2 item-center"/>
        
        
        <Text 
          className={`text-[15px]  ${
            focused ? 'font-bold text-white' : 'font-medium text-white/70'
          }`}
        >
          {label}
        </Text>
      </Animated.View>

      <Animated.View 
        style={{ opacity: opacityAnim }}
        className="absolute bottom-2 w-6 h-1 bg-white rounded-full shadow-sm"
      />
    </View>
  );
};

const Customerlayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: isWeb ? 70 : 75,
          borderTopLeftRadius:50,
          borderTopRightRadius:50,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['#590080', '#FF80BF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            // Professional curve for both platforms, slightly less aggressive on Web
            className={`flex-1 ${!isWeb ? 'rounded-t-[30px]' : 'rounded-t-2xl'} shadow-2xl`}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedIcon
              focused={focused}
              name={focused ? "home" : "home-outline"}
              size={24}
              color="white"
              label="Home"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedIcon
              focused={focused}
              name={focused ? "heart" : "heart-outline"}
              size={24}
              color="white"
              label="Wishlist"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedIcon
              focused={focused}
              name={focused ? "cart" : "cart-outline"}
              size={24}
              color="white"
              label="My cart"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedIcon
              focused={focused}
              name={focused ? "person" : "person-outline"}
              size={24}
              color="white"
              label="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default Customerlayout;