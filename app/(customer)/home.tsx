import { useStore } from "@/context/WishlistContext";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
    // image: "https://cdn-icons-png.flaticon.com/512/709/709790.png",
    image: "https://cdn-icons-png.flaticon.com/128/2203/2203124.png",
  },
];

const Home = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistPids, setWishlistPids] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Products | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    addToCart,
    addToWishlist,
    removeFromWishlist,
    wishlist,
    syncWishlist,
  } = useStore();
  const isWeb = Platform.OS === "web";

  const API_BASE = "http://192.168.0.186:8080";

  useEffect(() => {
    fetchCategories();
    fetchWishlist();
    fetchProducts();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("AccessToken");

      if (isWeb) localStorage.removeItem("AccessToken");

      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        "http://192.168.0.225:8081/api/admin/categories/all"
      );

      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "http://192.168.0.225:8081/api/admin/products/all"
      );

      setProducts(response.data);
    } finally {
      setLoading(false);
    }
  };
  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("AccessToken");
      const response = await axios.get(
        "http://192.168.0.225:8082/api/wishlist/byId",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (Array.isArray(response.data)) {
        syncWishlist(response.data);
        setWishlistItems(response.data);
        setWishlistPids(response.data.map((item: any) => item.pid));
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        console.log("--- BACKEND ERROR DETAILS ---");
        console.log("Status:", error.response.data.status);
        console.log("Message:", error.response.data.message);
        console.log("Path:", error.response.data.path);
      }
      syncWishlist([]);
      setWishlistItems([]);
      setWishlistPids([]);
    }
  };

  const handleToggleWishlist = async (product: Products) => {
    if (!product || !product.pid) return;

    const token = await AsyncStorage.getItem("AccessToken");
    if (!token) {
      Alert.alert("Login Required", "Please log in to manage your wishlist.");
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };
    const existingWishlistItem = wishlist.find(
      (item: any) => item.pid === product.pid
    );

    try {
      if (existingWishlistItem) {
        const identifier =
          existingWishlistItem.itemId || existingWishlistItem.id;

        const updatedList = wishlist.filter(
          (item: any) => item.pid !== product.pid
        );
        syncWishlist(updatedList);

        setWishlistPids((prev) => prev.filter((id) => id !== product.pid));

        await axios.delete(
          `http://192.168.0.225:8082/api/wishlist/remove/${identifier}`,
          config
        );
      } else {
        syncWishlist([...wishlist, product]);

        setWishlistPids((prev) => [...prev, product.pid]);

        await axios.post(
          `http://192.168.0.225:8082/api/wishlist/add`,
          { pid: product.pid },
          config
        );

        await fetchWishlist();
      }
    } catch (error: any) {
      console.error("Wishlist Error:", error.message);

      await fetchWishlist();
      Alert.alert("Error", "Could not update wishlist.");
    }
  };

  const renderProductCard = ({ item }: { item: Products }) => {
    // const isFavourite = wishlistPids.includes(item.pid);
    const isFavourite = wishlistPids.some(
      (pid) => String(pid) === String(item.pid)
    );

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          setSelectedProduct(item);
          setModalVisible(true);
        }}
        className="w-44 bg-white rounded-2xl p-3 mr-8 mb-8 border border-gray-100 shadow-sm"
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
              ₹{item.price}
            </Text>

            <Text className="text-xs text-gray-400 line-through ml-3 ">
              ₹{item.actualPrice}
            </Text>
          </View>

          <Text className="text-[10px] text-green-600 font-bold">
            {item.discount}% OFF
          </Text>
        </View>

        <View
          className={`${isWeb ? "flex-row justify-between items-center mt-2 " : "flex-col mt-2 "}`}
        >
          <Text
            numberOfLines={2}
            className="text-sm font-semibold text-gray-800 h-10"
          >
            {item.pname}
          </Text>

          <Text
            className={`text-[10px] text-gray-600 h-10 ${isWeb ? "mt-2" : ""}`}
          >
            Stock: {item.stockQuantity}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <View className="bg-gray-100 px-2 py-0.5 rounded">
            <Text className="text-[9px] text-gray-600">Premium</Text>
          </View>

          <Text className="text-xs font-bold">⭐ {item.rating || "4.5"}</Text>
        </View>

        <View className="flex-row justify-between">
          <TouchableOpacity className="flex-1 bg-[#590080] py-2 rounded-lg items-center mr-2">
            <Text className="text-white text-xs font-bold">ADD</Text>
          </TouchableOpacity>

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
        {/* </View> */}
      </TouchableOpacity>
    );
  };
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);

      const response = await axios.get(
        `http://192.168.0.225:8081/api/admin/products/product/${searchQuery}`
      );

      if (response.data) {
        setSelectedProduct(response.data);

        setModalVisible(true);
      } else {
        Alert.alert("Not Found", "We couldn't find a product with that name.");
      }
    } catch (error) {
      console.error("Search Error:", error);
      Alert.alert("Error", "Product not found. Try a different name.");
    } finally {
      setLoading(false);
      setSearchQuery("");
    }
  };

  const openSocialLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={["#590080", "#FF80BF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={` ${isWeb ? "rounded-b-[40px] pb-4" : "rounded-b-[40px] pb-4 pt-4"}`}
      >
        <View className="pt-5 px-5">
          <View
            className={`${isWeb ? "flex-row justify-between items-center " : "flex-row justify-between items-center"}`}
          >
            <View
              className={`${isWeb ? "flex-row items-center " : "flex-row items-center"}`}
            >
              <FontAwesome name="truck" size={isWeb ? 30 : 20} color="#fff" />

              <Text className="text-white text-2xl font-bold ml-2 italic">
                Dailydrop
              </Text>
            </View>

            <View
              className={`${isWeb ? "flex-row items-center gap-x-1" : "flex-row items-center gap-x-1 m-2 pt-2"}`}
            >
              <View
                className={`${isWeb ? "flex-row items-center bg-white h-10 rounded-xl px-6 w-60 lg:w-64" : "flex-row items-center justify-between px-2 ml-2 bg-white h-[27px] rounded-lg  w-[100px] "}`}
              >
                <FontAwesome
                  name="search"
                  size={isWeb ? 15 : 12}
                  color="#666"
                  className={`${isWeb ? "" : ""}`}
                />

                <TextInput
                  placeholder="Search..."
                  className={`${isWeb ? "flex-1 ml-2 text-sm outline-none" : "flex-1 py-2 text-sm outline-none"}`}
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                className={`${isWeb ? "flex-1 bg-[#590080] ml-4 py-2 px-8 rounded-xl items-center" : "w-[80px] h-[25px] ml-4 bg-[#590080] rounded-lg items-center"}`}
                onPress={handleLogout}
              >
                <Text className="text-white text-[15px] font-semibold ">
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mt-6">
          <Text className="text-xl font-bold text-gray-800 px-8 mb-4">
            Categories
          </Text>

          <FlatList
            data={categories}
            keyExtractor={(item) => `cat-${item.cid}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`${isWeb ? "w-[120px] h-[150px] bg-[#fff] p-[10px] rounded-[12px] items-center mr-[15px] shadow-lg m-4" : "w-[100px] h-[120px] bg-[#fff] p-[10px] rounded-[12px] items-center mr-[15px] shadow-lg mb-2"}`}
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

        <View
          className={`${isWeb ? "flex-row px-8 mt-8 justify-between" : ""}`}
        >
          <Image
            source={{
              uri: "https://static.vecteezy.com/system/resources/thumbnails/033/953/976/small_2x/online-shopping-concept-e-commerce-flash-sale-discount-payment-cashless-digital-flat-illustration-the-concept-of-online-shopping-on-social-media-app-shopping-online-on-website-or-mobile-free-vector.jpg",
            }}
            // className="flex-1 h-96 rounded-2xl mr-8"
            className={`${isWeb ? "flex-1 h-96 rounded-2xl mr-8" : "flex-1 h-48 rounded-2xl m-6"}`}
            resizeMode="cover"
          />

          <Image
            source={{
              uri: "https://static.vecteezy.com/system/resources/thumbnails/069/959/606/small/3d-winter-sale-with-podium-for-special-offer-and-shop-now-with-snow-and-ice-season-with-the-winter-theme-vector.jpg",
            }}
            // className="flex-1 h-96 rounded-2xl ml-2"
            className={`${isWeb ? "flex-1 h-96 rounded-2xl mr-8" : "flex-1 h-48 rounded-2xl m-6"}`}
            // source={{ uri: 'https://thumbs.dreamstime.com/b/online-shopping-merry-christmas-happy-new-year-theme-cute-chinese-boy-wearing-lion-hat-d-perspective-vector-design-trading-237326086.jpg' }}

            // className="flex-1 h-96 rounded-2xl ml-2"

            resizeMode="cover"
          />
        </View>

        <View className="mt-8 mb-8">
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
              keyExtractor={(item) => `prod-${item.pid}`}
              key={isWeb ? "web-10-col" : "android-horizontal"}
              horizontal={!isWeb}
              numColumns={isWeb ? 10 : 1}
              showsHorizontalScrollIndicator={false}
              renderItem={renderProductCard}
              contentContainerStyle={!isWeb ? { paddingHorizontal: 20 } : {}}
            />
          </ScrollView>
        </View>

        <View className="mt-8">
          <Text className="text-2xl font-bold text-center text-gray-900 mb-6">
            How it Works
          </Text>

          <View
            className={`${isWeb ? "flex-row justify-center" : "flex-col items-center"}`}
          >
            {howItWorksSteps.map((step) => (
              <View
                key={step.id}
                className={`${isWeb ? "w-72 bg-white rounded-3xl p-6 mr-8 mb-24 border border-gray-100 shadow-lg items-center" : "w-[230px] bg-white rounded-3xl p-6 mb-8 border border-gray-100 shadow-lg items-center"}`}
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
          </View>
        </View>

        <View className="bg-gray-100 pt-10 border-t border-gray-200">
          <View
            className={`px-10 ${isWeb ? "flex-row justify-evenly flex-wrap" : "flex-col"}`}
          >
            <View className={`mb-10 ${isWeb ? "w-1/4" : "w-full"}`}>
              <View className="flex-row items-center mb-2">
                <FontAwesome name="truck" size={28} color="#590080" />

                <Text className="text-2xl font-bold ml-2 italic text-[#590080]">
                  Daily Drop
                </Text>
              </View>

              <Text className="text-gray-500 text-sm">
                © 2025 Daily Drop Limited
              </Text>
            </View>

            <View
              className={`flex-row justify-evenly ${isWeb ? "w-3/5" : "w-full mb-10"}`}
            >
              <View>
                <Text className="font-bold text-gray-900 mb-4 text-base">
                  Company
                </Text>

                {["About Us", "Careers", "Team", "Minis"].map((link) => (
                  <Text
                    key={link}
                    className="text-gray-600 mb-3 text-sm hover:text-[#590080]"
                  >
                    {link}
                  </Text>
                ))}
              </View>

              <View className="ml-8">
                <Text className="font-bold text-gray-900 mb-4 text-base">
                  Contact us
                </Text>

                {["Help & Support", "Partner With Us", "Ride With Us"].map(
                  (link) => (
                    <Text key={link} className="text-gray-600 mb-3 text-sm">
                      {link}
                    </Text>
                  )
                )}
              </View>

              {/* <View>
                <Text className="font-bold text-gray-900 mb-4 text-base">
                  Legal
                </Text>

                {["Terms & Conditions", "Cookie Policy", "Privacy Policy"].map(
                  (link) => (
                    <Text key={link} className="text-gray-600 mb-3 text-sm">
                      {link}
                    </Text>
                  )
                )}
              </View> */}

              <View className={`${isWeb ? "w-1/5" : "w-full ml-8"}`}>
                <Text className="font-bold text-gray-900 mb-4 text-base">
                  Social Links
                </Text>

                <View className={`${isWeb ? "flex-row gap-x-5" : "gap-y-3"}`}>
                  <TouchableOpacity
                    onPress={() => openSocialLink("https://linkedin.com")}
                  >
                    <FontAwesome name="linkedin" size={20} color="#590080" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openSocialLink("https://instagram.com")}
                  >
                    <FontAwesome name="instagram" size={20} color="#590080" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openSocialLink("https://facebook.com")}
                  >
                    <FontAwesome name="facebook" size={20} color="#590080" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openSocialLink("https://twitter.com")}
                  >
                    <FontAwesome5 name="twitter" size={20} color="#590080" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-12 mb-16 border-t bg-[#fff] border-gray-300 pt-10 pb-10 items-center">
            <View className={`items-center ${isWeb ? "flex-row" : "flex-col"}`}>
              <Text
                className={` ${isWeb ? "text-xl font-bold text-gray-700 mr-8 mb-4" : "text-l font-bold text-gray-700 mr-15 mb-4"}`}
              >
                For better experience, download the app now
              </Text>

              <View className="flex-row gap-x-4 mb-2">
                <TouchableOpacity
                  className="bg-black flex-row items-center px-4 py-2 rounded-xl border border-gray-700"
                  onPress={() =>
                    openSocialLink("https://apps.apple.com/in/app")
                  }
                >
                  <FontAwesome name="apple" size={24} color="white" />

                  <View className="ml-3">
                    <Text className="text-[10px] text-white uppercase">
                      Download on the
                    </Text>

                    <Text className="text-white font-bold text-base">
                      App Store
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-black flex-row items-center px-4 py-2 rounded-xl border border-gray-700"
                  onPress={() =>
                    openSocialLink(
                      "https://play.google.com/store/games?device=windows&pli=1"
                    )
                  }
                >
                  <FontAwesome name="play" size={20} color="white" />

                  <View className="ml-3">
                    <Text className="text-[10px] text-white uppercase">
                      Get it on
                    </Text>

                    <Text className="text-white font-bold text-base">
                      Google Play
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[40px] p-6 h-[50%] w-[100%] shadow-xl">
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="absolute right-6 top-6 z-10 bg-gray-100 p-2 rounded-full"
            >
              <FontAwesome name="times" size={20} color="#666" />
            </TouchableOpacity>

            {selectedProduct && (
              <View className={`${isWeb ? "flex-row" : ""}`}>
                <Image
                  source={{
                    uri:
                      selectedProduct.imagePath ||
                      "https://via.placeholder.com/300",
                  }}
                  className={`${isWeb ? "w-1/2 h-48 mt-16 rounded-2xl" : "w-full h-64 rounded-2xl"}`}
                  resizeMode="contain"
                />

                <View className="mt-6 mb-5">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-gray-900">
                        {selectedProduct.pname}
                      </Text>
                      <Text className="text-green-600 font-bold mt-1">
                        {selectedProduct.discount}% OFF
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text className="text-2xl font-bold text-[#590080]">
                        ₹{selectedProduct.price}
                      </Text>
                      <Text className="text-sm text-gray-400 line-through">
                        ₹{selectedProduct.actualPrice}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mt-4 bg-gray-50 self-start px-3 py-1 rounded-full">
                    <FontAwesome name="star" size={14} color="#FFD700" />
                    <Text className="ml-1 font-bold text-gray-700">
                      {selectedProduct.rating || "4.5"}
                    </Text>
                  </View>

                  <Text className="text-lg font-bold text-gray-800 mt-6">
                    Description
                  </Text>
                  <Text className="text-gray-500 mt-2 leading-6">
                    {selectedProduct.description ||
                      "No description available for this premium product."}
                  </Text>

                  <View className="mt-6 border-t border-gray-100 pt-6 mb-10">
                    <TouchableOpacity
                      className="bg-[#590080] py-4 rounded-2xl items-center shadow-lg"
                      onPress={() => {
                        // Add to cart logic here
                        setModalVisible(false);
                      }}
                    >
                      <Text className="text-white text-lg font-bold">
                        Add to Cart • ₹{selectedProduct.price}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Home;
