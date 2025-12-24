import { useStore } from "@/context/WishlistContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, Text, View } from "react-native";

const isWeb = Platform.OS === "web";

const AnimatedIcon = ({
  focused,
  name,
  size,
  color,
  label,
  badgeCount,
}: {
  focused: boolean;
  name: React.ComponentProps<typeof Ionicons>["name"];
  size: number;
  color: string;
  label: string;
  badgeCount?: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
    ]).start();
  }, [focused]);

  useEffect(() => {
    if (badgeCount && badgeCount > 0) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.4,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [badgeCount]);

  return (
    <View className="items-center justify-center w-20">
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        }}
        className="items-center justify-center"
      >
        <Ionicons
          name={name}
          size={size}
          color={color}
          className={`px-2 item-center ${!isWeb ? "pt-8" : ""} pl-2`}
        />
        <Text
          className={`text-[15px] ${!isWeb ? "m-1" : ""} ${
            focused ? "font-bold text-white" : "font-medium text-white/70"
          }`}
        >
          {label}
        </Text>
      </Animated.View>

      {typeof badgeCount === "number" && badgeCount > 0 ? (
        <Animated.View
          style={{
            position: "absolute",
            right: isWeb ? 17 : 8,
            top: isWeb ? -8 : 5,
            backgroundColor: "#FF3B30",
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 4,
            transform: [{ scale: bounceAnim }],
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {badgeCount > 9 ? "9+" : badgeCount}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
};

const Customerlayout = () => {
  const { wishlist, cart } = useStore();

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
          borderTopLeftRadius: 50,
          borderTopRightRadius: 50,
          overflow: "hidden",
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={["#590080", "#FF80BF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className={`flex-1 ${!isWeb ? "rounded-t-[30px]" : "rounded-t-2xl"} shadow-2xl`}
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
              size={22}
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
              size={22}
              color="white"
              label="Wishlist"
              badgeCount={wishlist?.length}
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
              size={22}
              color="white"
              label="My cart"
              badgeCount={cart?.length}
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
              size={22}
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
