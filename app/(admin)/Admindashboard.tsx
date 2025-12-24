import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define the API URL base
const API_BASE_URL = "http://192.168.0.225:8081";

// --- Interfaces ---

interface CategoryData {
  cid: number;
  cname: string;
  cphoto: string;
}

interface ProductData {
  pid: number;
  pname: string;
  description: string;
  price: number;
  actualPrice: number;
  discount: number;
  stockQuantity: number;
  imagePath: string;
  rating: number;
  quantity: number;
  category: {
    cid: number;
    cname: string;
  };
}

const Admindashboard = () => {
  const isWeb = Platform.OS === "web";
  const router = useRouter();

  // --- Data State ---
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // ADDED: Search state
  const [loading, setLoading] = useState(true);

  // State to force image refresh (cache busting)
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // --- Add/Edit Category Modal State ---
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchProducts()]);
    setLoading(false);
    setLastUpdated(Date.now()); // Refresh images after fetch
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/categories/all`
      );
      if (Array.isArray(response.data)) setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/products/all`
      );
      if (Array.isArray(response.data)) setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // --- SEARCH LOGIC (useMemo for performance) ---
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.cname.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const groupedProducts = useMemo(() => {
    const filtered = products.filter(
      (product) =>
        product.pname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category?.cname || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );

    const grouped: { [key: string]: ProductData[] } = {};
    filtered.forEach((product) => {
      const groupName = product.category?.cname || "Other";
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(product);
    });
    return grouped;
  }, [products, searchQuery]);

  // --- Image Picker Helper ---
  const pickImage = async (setFunction: Function) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      if (isWeb) alert("Permission to access camera roll is required!");
      else
        Alert.alert(
          "Permission required",
          "Permission to access camera roll is required!"
        );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFunction(result.assets[0]);
    }
  };

  // --- Helpers ---
  const getImageUrl = (path: string) => {
    if (!path) return "https://via.placeholder.com/150";

    let finalUrl = path;
    if (!path.startsWith("http")) {
      if (path.includes("C:/") || path.includes("C:\\")) {
        const parts = path.split(/[/\\]/);
        const filename = parts[parts.length - 1];
        finalUrl = `${API_BASE_URL}/${filename}`;
      } else {
        finalUrl = `${API_BASE_URL}/${path}`;
      }
    }
    return `${finalUrl}?t=${lastUpdated}`;
  };

  // --- Category Actions (Edit/Delete) ---

  const handleDeleteCategory = (cid: number) => {
    if (!cid) {
      if (isWeb) alert("Error: Invalid Category ID");
      else Alert.alert("Error", "Invalid Category ID");
      return;
    }

    const performDelete = async () => {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/admin/categories/delete/${cid}`
        );
        if (response.status === 200 || response.status === 204) {
          setCategories((prev) => prev.filter((c) => c.cid !== cid));
          if (isWeb) alert("Success: Category deleted");
          else Alert.alert("Success", "Category deleted");
        }
      } catch (error: any) {
        console.error("Delete Error:", error);
        if (isWeb) alert("Delete Failed: Network Error");
        else Alert.alert("Delete Failed", "Network Error");
      }
    };

    if (isWeb) {
      if (
        window.confirm(
          "Delete Category: Are you sure? This will remove the category."
        )
      ) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Delete Category",
        "Are you sure? This will remove the category.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: performDelete },
        ]
      );
    }
  };

  const handleEditCategory = (category: CategoryData) => {
    setEditingCategory(category);
    setNewCategoryName(category.cname);
    setNewCategoryImage({ uri: getImageUrl(category.cphoto), isRemote: true });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryImage(null);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName || !newCategoryImage) {
      if (isWeb) alert("Validation Error: Name and image required.");
      else Alert.alert("Validation Error", "Name and image required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      const categoryData = { cname: newCategoryName };

      if (isWeb) {
        formData.append(
          "category",
          new Blob([JSON.stringify(categoryData)], { type: "application/json" })
        );
      } else {
        formData.append("category", JSON.stringify(categoryData));
      }

      if (newCategoryImage && !newCategoryImage.isRemote) {
        const uniqueName = `category_${Date.now()}.jpg`;
        if (isWeb) {
          const res = await fetch(newCategoryImage.uri);
          const blob = await res.blob();
          formData.append("image", blob, uniqueName);
        } else {
          formData.append("image", {
            uri: newCategoryImage.uri,
            name: uniqueName,
            type: "image/jpeg",
          } as any);
        }
      }

      let url = `${API_BASE_URL}/api/admin/categories/addimage/add`;
      let method = "POST";

      if (editingCategory) {
        url = `${API_BASE_URL}/api/admin/categories/update/${editingCategory.cid}`;
        method = "PUT";
      }

      const response = await axios({
        method: method,
        url: url,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: (data) => data,
      });

      if (response.status === 200 || response.status === 201) {
        closeModal();
        await fetchCategories();
        setLastUpdated(Date.now());
      }
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await AsyncStorage.clear();
        router.replace("/");
      } catch (error) {
        console.error("Logout Error:", error);
      }
    };

    if (isWeb) {
      if (window.confirm("Are you sure you want to log out?")) performLogout();
    } else {
      Alert.alert("Logout", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: performLogout },
      ]);
    }
  };

  return (
    // <SafeAreaView className="flex-1 bg-pink-100">
    <SafeAreaView className="flex-1 bg-pink-100" edges={["top"]}>
      {/* ----------------- ADMIN HEADER ----------------- */}
      {/* <View className={`flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white ${Platform.OS === 'android' ? 'pt-2' : 'py-4'}`}> */}
      <View
        className={`flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-pink-100 ${Platform.OS === "android" ? "pt-2" : "py-4"} relative z-50`}
        style={{ zIndex: 100 }} // Explicit zIndex for Web compatibility
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-extrabold text-[#8b008b] tracking-tighter">
            dailydrop
          </Text>
          <View className="bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
            <Text className="text-[10px] font-bold text-gray-500 uppercase">
              Admin
            </Text>
          </View>
        </View>

        {/* UPDATED SEARCH BAR */}
        <View className="flex-1 mx-4">
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Ionicons name="search" size={18} color="gray" />
            <TextInput
              placeholder="Search inventory..."
              className="flex-1 ml-2 text-base text-gray-700 outline-none"
              placeholderTextColor="gray"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="gray" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* PROFILE/LOGOUT */}
        <View style={{ position: "relative", zIndex: 1000 }}>
          <TouchableOpacity
            onPress={() => setProfileMenuVisible(!profileMenuVisible)}
            className="bg-slate-100 p-1 rounded-full border border-gray-100"
          >
            <Ionicons name="person-circle-outline" size={28} color="#8b008b" />
          </TouchableOpacity>

          {profileMenuVisible && (
            <View
              className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-2xl w-44 z-50 overflow-hidden"
              style={{
                elevation: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              }}
            >
              <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Administrator
                </Text>
                <Text
                  className="text-sm font-bold text-gray-800"
                  numberOfLines={1}
                >
                  admin@dailydrop.com
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setProfileMenuVisible(false);
                  handleLogout();
                }}
                className="flex-row items-center px-4 py-3 border-t border-gray-50 active:bg-red-50"
              >
                <Ionicons name="log-out-outline" size={18} color="#dc2626" />
                <Text className="ml-3 text-sm font-bold text-red-600">
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View className="h-24 justify-center items-center">
            <ActivityIndicator size="large" color="#8b008b" />
          </View>
        )}

        {/* 1. CATEGORIES (USING FILTERED DATA) */}
        {!loading && (
          <View className="pt-6 pb-2">
            {/* <Text className="px-4 mb-3 text-xs font-bold text-gray-400 uppercase">
                {searchQuery ? `Matching Categories (${filteredCategories.length})` : 'Active Categories'}
              </Text> */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              className="flex-row"
            >
              {filteredCategories.map((item) => (
                <View key={item.cid} className="mr-4 items-center w-[80px]">
                  <View className="w-20 h-20 bg-slate-50 rounded-xl items-center justify-center mb-2 overflow-hidden border border-slate-200 shadow-sm">
                    <Image
                      source={{ uri: getImageUrl(item.cphoto) }}
                      className="w-12 h-12"
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    className="text-center text-[11px] font-bold text-gray-700 leading-3 mb-2 h-6"
                    numberOfLines={2}
                  >
                    {item.cname}
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleEditCategory(item)}
                      className="bg-blue-50 p-1.5 rounded-md border border-blue-100"
                    >
                      <Ionicons name="pencil" size={12} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteCategory(item.cid)}
                      className="bg-red-50 p-1.5 rounded-md border border-red-100"
                    >
                      <Ionicons name="trash" size={12} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {!searchQuery && (
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  className="mr-4 items-center w-[70px] justify-start mt-2"
                >
                  <View className="w-16 h-16 bg-white rounded-xl items-center justify-center mb-1 overflow-hidden border border-dashed border-gray-300">
                    <Ionicons name="add" size={24} color="gray" />
                  </View>
                  <Text className="text-center text-[10px] font-bold text-gray-400 leading-3">
                    Add New
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* 2. OFFERS (HIDDEN DURING SEARCH) */}
        {!searchQuery && (
          <View className="py-2">
            <View className="px-4 mb-2 flex-row justify-between">
              <Text className="text-xs font-bold text-gray-400 uppercase">
                Live Offers
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              className="flex-row"
            >
              <OfferCardChristmas isWeb={isWeb} />
              <OfferCardPurple isWeb={isWeb} />
              <OfferCardChristmas isWeb={isWeb} />
            </ScrollView>
          </View>
        )}

        {/* 3. INVENTORY (USING FILTERED DATA) */}
        {!loading && Object.keys(groupedProducts).length > 0
          ? Object.keys(groupedProducts).map((categoryName) => (
              <View key={categoryName} className="pb-8 pt-4">
                <View className="px-4 mb-3 flex-row justify-between items-center border-t border-gray-100 pt-4">
                  <Text className="text-lg font-bold text-gray-800">
                    {categoryName}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  className="flex-row"
                >
                  {groupedProducts[categoryName].map((product) => (
                    <View
                      key={product.pid}
                      className="w-40 mr-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                      <View className="h-28 bg-white justify-center items-center relative p-2">
                        <Image
                          source={{ uri: getImageUrl(product.imagePath) }}
                          className="w-full h-full"
                          resizeMode="contain"
                        />
                        {/* <View className={`absolute top-1 left-1 px-1.5 py-0.5 rounded ${product.stockQuantity < 5 ? 'bg-red-100' : 'bg-green-100'}`}>
                                    <Text className={`text-[8px] font-bold ${product.stockQuantity < 5 ? 'text-red-700' : 'text-green-700'}`}>Stock: {product.stockQuantity}</Text>
                                </View> */}
                        {/* Updated Stock Badge Logic */}
                        <View
                          className={`absolute top-1 left-1 px-1.5 py-0.5 rounded ${
                            product.stockQuantity === 0
                              ? "bg-red-600" // Solid red background for out of stock
                              : product.stockQuantity < 5
                                ? "bg-red-100" // Light red for low stock
                                : "bg-green-100" // Green for healthy stock
                          }`}
                        >
                          <Text
                            className={`text-[8px] font-bold ${
                              product.stockQuantity === 0
                                ? "text-white" // White text on dark red
                                : product.stockQuantity < 5
                                  ? "text-red-700"
                                  : "text-green-700"
                            }`}
                          >
                            {product.stockQuantity === 0
                              ? "OUT OF STOCK"
                              : `Stock: ${product.stockQuantity}`}
                          </Text>
                        </View>
                      </View>
                      <View className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50">
                        <Text
                          className="font-semibold text-gray-800 text-xs mb-1 h-8"
                          numberOfLines={2}
                        >
                          {product.pname}
                        </Text>
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="font-bold text-sm text-gray-900">
                            ₹{product.actualPrice}
                          </Text>

                          <Text className="text-[10px] text-gray-400 line-through ">
                            ₹{product.price}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ))
          : !loading &&
            searchQuery !== "" && (
              <View className="py-20 items-center">
                <Ionicons name="search-outline" size={48} color="#cbd5e1" />
                <Text className="text-gray-400 mt-2 font-medium">
                  No matches found for "{searchQuery}"
                </Text>
              </View>
            )}
      </ScrollView>

      {/* MODAL (unchanged) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close-circle" size={28} color="gray" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Category Name
            </Text>
            <TextInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g., Snacks"
              className="border border-gray-300 rounded-xl px-4 py-3 mb-6 text-base bg-gray-50"
            />
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Category Icon
            </Text>
            <TouchableOpacity
              onPress={() => pickImage(setNewCategoryImage)}
              className="h-32 border-2 border-dashed border-gray-300 rounded-xl justify-center items-center bg-gray-50 mb-8"
            >
              {newCategoryImage ? (
                <Image
                  source={{ uri: newCategoryImage.uri }}
                  className="w-full h-full rounded-xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="items-center">
                  <Ionicons name="image-outline" size={32} color="gray" />
                  <Text className="text-gray-400 text-xs mt-1">
                    Tap to select image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveCategory}
              disabled={submitting}
              className={`py-4 rounded-xl items-center ${submitting ? "bg-purple-300" : "bg-[#8b008b]"}`}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {editingCategory ? "Update Category" : "Create Category"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- Offer Components (Helper) ---
const OfferCardChristmas = ({ isWeb }: { isWeb: boolean }) => (
  // Changed 'flex-1 h-48' to 'w-96 h-64 mr-6' for a larger web card
  <View
    className={`${isWeb ? "w-96 h-64 mr-6" : "w-72 h-40 mr-4"} bg-red-600 rounded-xl p-4 justify-between shadow-sm overflow-hidden relative opacity-90`}
  >
    {/* Increased icon size for web from 140 to 180 */}
    <View className="absolute right-0 bottom-0 opacity-20">
      <Ionicons name="gift" size={isWeb ? 180 : 100} color="white" />
    </View>
    <View className="absolute left-10 top-0 opacity-10">
      <Ionicons name="snow" size={isWeb ? 80 : 60} color="white" />
    </View>
    <View>
      <Text
        className={`${isWeb ? "text-2xl" : "text-lg"} text-white font-bold`}
      >
        Christmas Special
      </Text>
      <View className="flex-row items-center mt-1">
        <Text className="text-white text-xs">Flat </Text>
        <View className="bg-white px-1 rounded mx-1">
          <Text className="text-red-600 font-bold text-xs">50% OFF</Text>
        </View>
      </View>
      <Text className="text-red-100 text-[10px] mt-1">Banner Preview</Text>
    </View>
    <View className="bg-white/20 self-start px-2 py-1 rounded mt-2">
      <Text className="text-white text-[10px]">Active</Text>
    </View>
  </View>
);
const OfferCardPurple = ({ isWeb }: { isWeb: boolean }) => (
  // Changed 'flex-1 h-48' to 'w-96 h-64 mr-6'
  <View
    className={`${isWeb ? "w-96 h-64 mr-6" : "w-72 h-40 mr-4"} bg-purple-100 rounded-xl p-4 justify-between shadow-sm border border-purple-200 opacity-90`}
  >
    <Text className="text-purple-800 font-bold text-[10px] tracking-widest text-center">
      DAILYDROP EXPERIENCE
    </Text>
    <View className="flex-row justify-around items-center mt-2">
      {/* Adjusted padding/height for a larger look on web */}
      <View
        className={`bg-white p-2 rounded-lg shadow-sm items-center flex-1 mr-2 ${isWeb ? "py-6" : "py-3"}`}
      >
        <Ionicons
          name="wallet-outline"
          size={isWeb ? 30 : 20}
          color="#8b008b"
        />
        <Text
          className={`text-[#8b008b] font-bold ${isWeb ? "text-lg" : "text-sm"}`}
        >
          ₹0 FEES
        </Text>
      </View>
      <View
        className={`bg-white p-2 rounded-lg shadow-sm items-center flex-1 ${isWeb ? "py-6" : "py-3"}`}
      >
        <Ionicons
          name="pricetag-outline"
          size={isWeb ? 30 : 20}
          color="#8b008b"
        />
        <Text
          className={`text-[#8b008b] font-bold ${isWeb ? "text-xs" : "text-[10px]"} text-center`}
        >
          LOWEST PRICES
        </Text>
      </View>
    </View>
    <View className="bg-purple-200/50 self-center px-2 py-0.5 rounded mt-1">
      <Text className="text-purple-800 text-[9px]">Default Banner</Text>
    </View>
  </View>
);

export default Admindashboard;