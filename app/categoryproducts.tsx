import { useStore } from "@/context/WishlistContext"; // 1. Import your context
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

// Type definition
type Product = {
  pid: number;
  pname: string;
  description: string;
  price: number;
  stockQuantity: number;
  imagePath: string;
  actualPrice: number;
  discount: number;
  rating: number;
};

const CategoryProducts = () => {
  const { cid, cname } = useLocalSearchParams();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showViewCartFor, setShowViewCartFor] = useState<number | null>(null);

  // 2. Consume wishlist and sync functions from Global Store
  const { wishlist, syncWishlist } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (cid) fetchProductsByCategory();
    fetchWishlistFromServer(); // Sync on mount
    fetchCart();
  }, [cid]);

  const fetchProductsByCategory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://192.168.0.225:8081/api/admin/products/category/${cid}`
      );
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching category products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistFromServer = async () => {
    try {
      const token = await AsyncStorage.getItem("AccessToken");
      if (!token) return;

      const response = await axios.get(
        "http://192.168.0.225:8082/api/wishlist/byId",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the global context with data from server
      if (Array.isArray(response.data)) {
        syncWishlist(response.data);
      }
    } catch (error) {
      console.error("Error syncing wishlist:", error);
    }
  };

  //fetching cart items
  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem("AccessToken");
      if (!token) return;

      const res = await axios.get(
        "http://192.168.0.225:8082/api/cart/byId",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCartItems(res.data?.items || []);
    } catch (e) {
      console.log("Cart fetch error", e);
    }
  };

  //fetch quantity
  const getCartQty = (pid: number) => {
      const found = cartItems.find((c: any) => c.pid === pid);
      return found ? found.quantity : 0;
    };

    //addproducts to cart
   const addToCart = async (product: Product) => {
      const token = await AsyncStorage.getItem("AccessToken");
      if (!token) {
        Alert.alert("Login Required", "Please login to add items");
        return;
      }

      await axios.post(
        "http://192.168.0.225:8082/api/cart/add",
        { pid: product.pid, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    fetchCart(); // refresh cart
    setShowViewCartFor(product.pid);

  };
    
  //update cart quantity
  const updateCartQty = async (cartItemId: number, qty: number) => {
      if (qty < 1) return;

      const token = await AsyncStorage.getItem("AccessToken");
      if (!token) return;

      await axios.put(
        `http://192.168.0.225:8082/api/cart/item/${cartItemId}/quantity`,
        {},
        {
          params: { quantity: qty },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchCart();
    };


  const handleToggleWishlist = async (product: Product) => {
    if (!product || !product.pid) return;

    const token = await AsyncStorage.getItem("AccessToken");
    if (!token) {
      Alert.alert("Login Required", "Please log in to manage your wishlist.");
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Find if the item exists in the global wishlist state
    const existingWishlistItem = wishlist.find(
      (item: any) => item.pid === product.pid
    );

    try {
      if (existingWishlistItem) {
        // --- REMOVE LOGIC ---
        const identifier =
          existingWishlistItem.itemId || existingWishlistItem.id;

        // Optimistic Update: Update Global UI state immediately
        const updatedList = wishlist.filter(
          (item: any) => item.pid !== product.pid
        );
        syncWishlist(updatedList);

        await axios.delete(
          `http://192.168.0.225:8082/api/wishlist/remove/${identifier}`,
          config
        );
      } else {
        syncWishlist([...wishlist, product]);

        await axios.post(
          `http://192.168.0.225:8082/api/wishlist/add`,
          { pid: product.pid },
          config
        );

        await fetchWishlistFromServer();
      }
    } catch (error: any) {
      console.error("Wishlist Error:", error.message);

      await fetchWishlistFromServer();
      Alert.alert("Error", "Could not update wishlist.");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className={`${isWeb ? "flex-row items-center p-5 bg-white border-b border-gray-100" : "flex-row items-center p-5 mt-8 bg-white border-b border-gray-100"}`}
      >
        <TouchableOpacity onPress={() => router.back()} className="pr-4">
          <FontAwesome name="arrow-left" size={20} color="#590080" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#590080]">{cname}</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#590080" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.pid.toString()}
          numColumns={isWeb ? 6 : 2}
          key={isWeb ? "web-grid" : "mobile-grid"}
          columnWrapperStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => {
            const cartQty = getCartQty(item.pid);
            const cartItem = cartItems.find((c: any) => c.pid === item.pid);

            // Check if this specific product's ID is in the global wishlist array
            const isFavourite = wishlist.some(
              (fav: any) => fav.pid === item.pid
            );

            return (
              <View
                className={`${isWeb ? "w-48" : "flex-1"} bg-white rounded-2xl p-3 m-2 border border-gray-100 shadow-sm`}
              >
                <Image
                  source={{
                    uri: item.imagePath || "https://via.placeholder.com/150",
                  }}
                  className="w-full h-24 mb-2"
                  resizeMode="contain"
                />
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-bold text-black">
                    ₹{item.price}
                  </Text>
                  <Text className="text-xs text-gray-400 line-through">
                    ₹{item.actualPrice}
                  </Text>
                </View>
                <Text
                  numberOfLines={2}
                  className="text-sm font-semibold text-gray-800 h-10 mt-1"
                >
                  {item.pname}
                </Text>

                <View className="flex-row justify-between items-center mt-2 mb-3">
                  <Text className="text-[10px] text-green-600 font-bold">
                    {item.discount}% OFF
                  </Text>
                  <Text className="text-xs font-bold">
                    ⭐ {item.rating || "4.5"}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  {/*  CART BUTTON */}
                {cartQty === 0 ? (
                    <TouchableOpacity
                      className="flex-1 bg-[#590080] py-2 rounded-lg items-center mr-2"
                      onPress={() => addToCart(item)}
                    >
                      <Text className="text-white text-xs font-bold">ADD</Text>
                    </TouchableOpacity>
                    ) : showViewCartFor === item.pid ? (
                      <TouchableOpacity
                        className="flex-1 bg-green-600 py-2 rounded-lg items-center mr-2"
                        onPress={() => router.push("/(customer)/cart")}
                      >
                        <Text className="text-white text-xs font-bold">VIEW CART</Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="flex-1 flex-row items-center justify-between border border-[#590080] rounded-lg mr-2 px-2 py-1">
                        <TouchableOpacity
                          onPress={() => updateCartQty(cartItem.id, cartQty - 1)}
                        >
                          <Text className="text-lg font-bold text-[#590080]">−</Text>
                        </TouchableOpacity>

                        <Text className="text-sm font-bold text-[#590080]">
                          {cartQty}
                        </Text>

                        <TouchableOpacity
                          onPress={() => updateCartQty(cartItem.id, cartQty + 1)}
                        >
                          <Text className="text-lg font-bold text-[#590080]">+</Text>
                        </TouchableOpacity>
                      </View>
                )}


                  {/* ❤️ WISHLIST BUTTON */}
                  <TouchableOpacity
                    className="p-2 rounded-lg w-10 items-center justify-center"
                    style={{
                      backgroundColor: isFavourite ? "#FF80BF" : "#ff80bf",
                    }}
                    onPress={() => handleToggleWishlist(item)}
                  >
                    <FontAwesome5
                      name="heart"
                      size={16}
                      color={isFavourite ? "#ff3385" : "#fff"}
                      solid={isFavourite}
                    />
                  </TouchableOpacity>

                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

export default CategoryProducts;