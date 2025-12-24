import { useStore } from "@/context/WishlistContext";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router, useFocusEffect } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WishlistScreen() {
  const [wishlist, setWishlist] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const { syncWishlist } = useStore();
  const isWeb = Platform.OS === "web";

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("AccessToken");
      const response = await axios.get(
        "http://192.168.0.225:8082/api/wishlist/byId",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const items = response.data.items || response.data;
      const itemsArray = Array.isArray(items) ? items : [];

      setWishlist(itemsArray);

      syncWishlist(itemsArray);
    } catch (error) {
      console.error("Error loading wishlist:", error);
      setWishlist([]);
      syncWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  // const loadWishlist = async () => {
  //   try {
  //     setLoading(true);
  //     const token = await AsyncStorage.getItem("AccessToken");
  //     if (!token) return;

  //     const response = await axios.get(
  //       "http://192.168.0.225:8082/api/wishlist/byId",
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );

  //     if (response.data && Array.isArray(response.data)) {
  //       setWishlist(response.data);
  //     } else {
  //       console.warn("Backend returned non-array data:", response.data);
  //       setWishlist([]);
  //     }
  //   } catch (error: any) {
  //     console.error(
  //       "Error loading wishlist:",
  //       error.response?.data || error.message
  //     );
  //     setWishlist([]); // Clear on error
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useFocusEffect(
    React.useCallback(() => {
      loadWishlist();
    }, [])
  );

  const remove = async (itemId: string) => {
    const previousWishlist = [...(wishlist || [])];
    if (!itemId) {
      Alert.alert(
        "Error",
        "This item is missing a valid identifier (Legacy Data)."
      );
      return;
    }
    setWishlist(previousWishlist.filter((item) => item.itemId !== itemId));
    const updatedList = previousWishlist.filter(
      (item) => item.itemId !== itemId
    );
    try {
      const token = await AsyncStorage.getItem("AccessToken");

      const response = await axios.delete(
        `http://192.168.0.225:8082/api/wishlist/remove/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWishlist(updatedList);
      syncWishlist(updatedList);
      console.log("Delete successful:", response.status);
    } catch (error: any) {
      console.error(
        "Delete failed on server:",
        error.response?.data || error.message
      );
      syncWishlist(previousWishlist);

      setWishlist(previousWishlist);

      const errorMsg =
        error.response?.data?.message || "Could not remove item from server.";
      Alert.alert("Delete Failed", errorMsg);
    }
  };
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#590080" />
      </View>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <View className="bg-pink-50 p-5 rounded-full mb-6">
          <FontAwesome5 name="heart" size={50} color="#ff3385" opacity={0.2} />
        </View>
        <Text className="text-2xl font-bold text-gray-800">No items added</Text>
        <Text className="text-gray-500 text-center mt-2">
          Your wishlist is currently empty.
        </Text>
        <TouchableOpacity
          className="mt-8 bg-[#590080] px-8 py-4 rounded-2xl"
          onPress={() => router.push("/(customer)/home")}
        >
          <Text className="text-white font-bold text-lg">Go Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4 mb-20">
      <View
        className={`${isWeb ? "flex-row items-center mb-6" : "flex-row items-center mb-6 mt-8"}`}
      >
        <FontAwesome5 name="heart" size={24} color="#ff3385" solid />
        <Text className="text-2xl font-bold italic ml-2 text-gray-800">
          My Wishlist ({wishlist.length})
        </Text>
      </View>

      <FlatList
        data={wishlist}
        keyExtractor={(item, index) => {
          if (item.itemId) return item.itemId.toString();
          if (item.id) return item.id.toString();
          return index.toString();
        }} // Using UUID as key
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-3xl m-2 flex-row items-center shadow-md">
            <Image
              source={{ uri: item.imagePath }}
              className="w-20 h-20 rounded-xl"
              resizeMode="contain"
            />
            <View className="flex-1 ml-4">
              <Text className="font-bold text-gray-800 text-lg">
                {item.pname}
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-[#590080] font-black text-lg mr-2">
                  ₹{item.price}
                </Text>
                <Text className="text-xs text-green-600 font-bold">
                  {item.discount}% OFF
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => remove(item.itemId || item.id)}>
              <View className="bg-red-50 p-3 rounded-2xl flex-row border border-[#ff3385]">
                <Text className="text-[#ff3385] font-semibold mr-2">
                  Remove
                </Text>
                <FontAwesome5 name="trash" size={16} color="#ff3385" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
