import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { cartApi } from "../(utils)/axiosInstance";

type Category = { cid: number; cname: string; cphoto: string };
type Products = {
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

const howItWorksSteps = [
  {
    id: 1,
    title: "Open the app",
    description:
      "Choose from over 7000 products across groceries, fresh fruits & veggies, meat, pet care, beauty items & more",
    image: "https://cdn-icons-png.flaticon.com/512/19033/19033326.png",
  },
  {
    id: 2,
    title: "Place an order",
    description: "Add your favourite items to the cart & avail the best offers",
    image: "https://cdn-icons-png.flaticon.com/512/3081/3081840.png",
  },
  {
    id: 3,
    title: "Get free delivery",
    description:
      "Experience lighting-fast speed & get all your items delivered in 10 minutes",
    image: "https://cdn-icons-png.flaticon.com/512/709/709790.png",
  },
];

const Home = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistPids, setWishlistPids] = useState<number[]>([]);

  // pid -> itemId, quantity
  const [cartItemIds, setCartItemIds] = useState<number[]>([]);
  const [cartItemsMap, setCartItemsMap] = useState<
    Record<number, { itemId: number; quantity: number }>
  >({});
  const [recentlyAddedProduct, setRecentlyAddedProduct] =
    useState<Products | null>(null);

  const isWeb = Platform.OS === "web";
  const API_BASE = "http://192.168.0.225:8081";

  const params = useLocalSearchParams();
  const passedProduct = params?.product
    ? (() => {
        try {
          return JSON.parse(params.product as string);
        } catch {
          return null;
        }
      })()
    : null;

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/categories/all`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/products/all`);
      setProducts(response.data);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CART HELPERS ----------------

  const fetchCartItems = async () => {
    try {
      const response = await cartApi.get(`/api/cart/byId`);
      const items = response.data?.items || [];

      const ids: number[] = [];
      const map: Record<number, { itemId: number; quantity: number }> = {};

      items.forEach((item: any) => {
        ids.push(item.pid);
        map[item.pid] = { itemId: item.id, quantity: item.quantity };
      });

      setCartItemIds(ids);
      setCartItemsMap(map);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      setCartItemIds([]);
      setCartItemsMap({});
    }
  };

  const storeRecentlyAddedProduct = async (product: Products) => {
    try {
      await AsyncStorage.setItem(
        "recentlyAddedProduct",
        JSON.stringify(product),
      );
    } catch (error) {
      console.error("Error storing recently added product:", error);
    }
  };

  const addToCart = async (product: Products) => {
    try {
      if (!product?.pid) {
        Alert.alert("Error", "Invalid product");
        return;
      }

      await cartApi.post(`/api/cart/add`, {
        pid: product.pid,
        quantity: 1,
      });

      await fetchCartItems();

      setRecentlyAddedProduct(product);
      await storeRecentlyAddedProduct(product);

      if (Platform.OS !== "web") {
        Alert.alert("Success", "Item added to cart!");
      }
    } catch (error: any) {
      console.error("Add to cart error:", error.response?.data || error);
      Alert.alert("Error", "Could not add to cart");
    }
  };

  const updateCartItemQuantity = async (itemId: number, newQty: number) => {
    try {
      await cartApi.put(
        `/api/cart/item/${itemId}/quantity`,
        {},
        { params: { quantity: newQty } },
      ); // [file:3]

      setCartItemsMap(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(pidStr => {
          const pid = Number(pidStr);
          if (updated[pid].itemId === itemId) {
            updated[pid] = { ...updated[pid], quantity: newQty };
          }
        });
        return updated;
      });
    } catch (error: any) {
      console.error(
        "updateCartItemQuantity error:",
        error.response?.data || error,
      );
      Alert.alert("Error", "Failed to update quantity");
    }
  };

  useEffect(() => {
    if (passedProduct) {
      addToCart(passedProduct as Products);
      router.setParams({ product: undefined });
    }
  }, [passedProduct]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("AccessToken");
      if (isWeb) (window as any).localStorage?.removeItem("AccessToken");
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchWishlistFromServer = async () => {
        try {
          const response = await cartApi.get(`/api/wishlist/all`);
          const pids = response.data.map((item: any) => item.pid);
          setWishlistPids(pids);
        } catch (error) {
          console.error("Error fetching wishlist from server:", error);
        }
      };
      fetchWishlistFromServer();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      fetchCartItems();
    }, []),
  );

  const handleToggleWishlist = async (product: Products) => {
    if (!product || !product.pid) return;

    try {
      const stored = await AsyncStorage.getItem("user_wishlist");
      let currentWishlist = stored ? JSON.parse(stored) : [];
      currentWishlist = currentWishlist.filter((i: any) => i !== null);

      const exists = currentWishlist.find(
        (item: any) => item.pid === product.pid,
      );
      let updatedWishlist;

      if (exists) {
        updatedWishlist = currentWishlist.filter(
          (item: any) => item.pid !== product.pid,
        );
      } else {
        updatedWishlist = [...currentWishlist, product];
      }

      await AsyncStorage.setItem(
        "user_wishlist",
        JSON.stringify(updatedWishlist),
      );
      setWishlistPids(updatedWishlist.map((i: any) => i.pid));

      if (Platform.OS !== "web") {
        Alert.alert(
          exists ? "Removed" : "Added",
          exists ? "Removed from wishlist" : "Added to wishlist! ❤️",
        );
      }
    } catch (error) {
      console.error("Wishlist error:", error);
    }
  };

  const renderProductCard = ({ item }: { item: Products }) => {
    const sellingPrice = Math.min(item.price, item.actualPrice);
    const originalPrice = Math.max(item.price, item.actualPrice);
    const isFavourite = wishlistPids.includes(item.pid);
    const isInCart = cartItemIds.includes(item.pid);
    const cartInfo = cartItemsMap[item.pid];
    const quantity = cartInfo?.quantity || 0;

    const handleIncrease = () => {
      if (!cartInfo) return;
      const newQty = quantity + 1;
      updateCartItemQuantity(cartInfo.itemId, newQty);
    };

    const handleDecrease = () => {
      if (!cartInfo) return;
      const newQty = Math.max(1, quantity - 1);
      updateCartItemQuantity(cartInfo.itemId, newQty);
    };

    return (
      <View
        className="w-44 bg-white rounded-2xl p-3 mr-6 mb-4 border border-gray-100 shadow-sm"
        style={{ elevation: 3 }}
      >
        <Image
          source={{
            uri: item.imagePath || "https://via.placeholder.com/150",
          }}
          className="w-full h-24 mb-2"
          resizeMode="contain"
        />

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-black">
             ₹{sellingPrice}
            </Text>
            <Text className="text-xs text-gray-400 line-through ml-3">
              ₹{originalPrice}
            </Text>
          </View>
          <Text className="text-[10px] text-green-600 font-bold">
            {item.discount}% OFF
          </Text>
        </View>

        <View className="mt-2 flex-row justify-between items-center">
          <Text
            numberOfLines={2}
            className="text-sm font-semibold text-gray-800 h-10"
          >
            {item.pname}
          </Text>
          <Text className="text-[10px] text-gray-600 h-10 mt-2">
            Stock: {item.stockQuantity}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <View className="bg-gray-100 px-2 py-0.5 rounded">
            <Text className="text-[9px] text-gray-600">Premium</Text>
          </View>
          <Text className="text-xs font-bold">
            ⭐ {item.rating || "4.5"}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          {isInCart && quantity > 0 ? (
            <View className="flex-row items-center bg-white rounded border border-[#f4d8d8] py-1 px-1.5 flex-1 mr-2">
              <TouchableOpacity
                className="px-2 py-1"
                onPress={handleDecrease}
              >
                <Text className="text-lg text-[#e63a00] font-semibold">
                  −
                </Text>
              </TouchableOpacity>
              <Text className="text-base font-semibold text-[#e65c00] mx-2">
                {quantity}
              </Text>
              <TouchableOpacity
                className="px-2 py-1"
                onPress={handleIncrease}
              >
                <Text className="text-lg text-[#e63a00] font-semibold">
                  +
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center mr-2 bg-[#590080]"
              onPress={() => addToCart(item)}
            >
              <Text className="text-white text-xs font-bold">ADD</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="p-2 rounded-lg w-10 items-center justify-center"
            style={{ backgroundColor: isFavourite ? "#FF80BF" : "#ff80bf" }}
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
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={["#590080", "#FF80BF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-b-[40px] pb-5 z-10"
      >
        <SafeAreaView>
          <View className="pt-5 px-5">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <FontAwesome name="truck" size={30} color="#fff" />
                <Text className="text-white text-2xl font-bold ml-3 italic">
                  FastDelivery
                </Text>
              </View>

              <View className="flex-row items-center gap-x-2">
                <View className="flex-row items-center bg-white h-10 rounded-xl px-6 w-60 lg:w-64">
                  <FontAwesome name="search" size={16} color="#666" />
                  <TextInput
                    placeholder="Search..."
                    className="flex-1 ml-2 text-sm outline-none"
                    placeholderTextColor="#999"
                  />
                </View>
                <TouchableOpacity
                  className="flex-1 bg-[#590080] ml-4 py-2 px-8 rounded-xl items-center"
                  onPress={handleLogout}
                >
                  <Text className="text-white text-[20px] font-semibold">
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mt-6">
          <Text className="text-xl font-bold text-gray-800 px-8 mb-4">
            Categories
          </Text>
          <FlatList
            data={categories}
            keyExtractor={item => `cat-${item.cid}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="w-[120px] h-[150px] bg-[#fff] p-[10px] rounded-[12px] items-center mr-[15px] shadow-lg m-4"
                onPress={() =>
                  router.push({
                    pathname: "/categoryproducts",
                    params: { cid: item.cid, cname: item.cname },
                  })
                }
              >
                <Image
                  source={{ uri: item.cphoto }}
                  className="w-16 h-16 rounded-full bg-gray-200"
                />
                <Text className="mt-2 text-[15px] font-semibold text-center text-gray-700">
                  {item.cname}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View className="flex-row px-8 mt-8 justify-between">
          <Image
            source={{
              uri: "https://static.vecteezy.com/system/resources/thumbnails/033/953/976/small_2x/online-shopping-concept-e-commerce-flash-sale-discount-payment-cashless-digital-flat-illustration-the-concept-of-online-shopping-on-social-media-app-shopping-online-on-website-or-mobile-free-vector.jpg",
            }}
            className="flex-1 h-96 rounded-2xl mr-8"
            resizeMode="cover"
          />
          <Image
            source={{
              uri: "https://img.freepik.com/free-vector/delivery-staff-ride-motorcycles-shopping-concept_1150-34879.jpg?semt=ais_hybrid&w=740&q=80",
            }}
            className="flex-1 h-96 rounded-2xl ml-2"
            resizeMode="cover"
          />
        </View>

        {recentlyAddedProduct && (
          <View className="mx-4 mt-4 mb-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-3">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <Text className="text-sm font-semibold text-green-600">
                Recently Added
              </Text>
            </View>
            <View className="flex-row items-center">
              <Image
                source={{
                  uri:
                    recentlyAddedProduct.imagePath ||
                    "https://via.placeholder.com/60",
                }}
                className="w-16 h-16 rounded-lg mr-3"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text
                  className="text-base font-semibold text-gray-800 mb-1"
                  numberOfLines={1}
                >
                  {recentlyAddedProduct.pname}
                </Text>
                <Text className="text-sm font-bold text-black mb-1">
                  ₹{recentlyAddedProduct.price}
                </Text>
                <Text className="text-xs text-gray-500">1 item • In Cart</Text>
              </View>
              <TouchableOpacity
                className="bg-[#590080] py-2 px-4 rounded-lg"
                onPress={() => {
                  setRecentlyAddedProduct(null);
                  AsyncStorage.removeItem("recentlyAddedProduct");
                  router.push("/(customer)/cart");
                }}
              >
                <Text className="text-white text-xs font-bold">VIEW CART</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="mt-8 mb-24">
          <Text className="text-xl font-bold text-gray-800 px-5 mb-4">
            Featured Products
          </Text>
          <ScrollView
            horizontal={isWeb}
            showsHorizontalScrollIndicator={isWeb}
            contentContainerStyle={isWeb ? { paddingHorizontal: 20 } : {}}
          >
            <FlatList
              data={products}
              keyExtractor={item => `prod-${item.pid}`}
              key={isWeb ? "web-10-col" : "android-horizontal"}
              horizontal={!isWeb}
              numColumns={isWeb ? 10 : 1}
              showsHorizontalScrollIndicator={false}
              renderItem={renderProductCard}
              contentContainerStyle={!isWeb ? { paddingHorizontal: 20 } : {}}
            />
          </ScrollView>
        </View>

        <View className="mt-10 mb-6">
          <Text className="text-2xl font-bold text-center text-gray-900 mb-6">
            How it Works
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {howItWorksSteps.map(step => (
              <View
                key={step.id}
                className="w-72 bg-white rounded-3xl p-6 mr-5 border border-gray-100 shadow-sm items-center"
                style={{ elevation: 2 }}
              >
                <View className="w-24 h-24 items-center justify-center mb-4">
                  <Image
                    source={{ uri: step.image }}
                    className="w-20 h-20"
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-lg font-bold text-gray-900 mb-2 text-center">
                  {step.title}
                </Text>
                <Text className="text-gray-500 text-center leading-5 text-sm">
                  {step.description}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;
