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
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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
interface Category {
  cid: number;
  cname: string;
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
  category: Category;
}

interface ImageAsset {
  uri: string;
  isRemote?: boolean;
  type?: string;
  fileName?: string;
}

const Customizations = () => {
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  // --- Data State ---
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // New Category State
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // --- Modal & Form State ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [submitting, setSubmitting] = useState(false);

  // Track the product being edited (null if adding)
  const [activeProduct, setActiveProduct] = useState<ProductData | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formActualPrice, setFormActualPrice] = useState("");
  const [formDiscount, setFormDiscount] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formImage, setFormImage] = useState<ImageAsset | null>(null);
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Products and Categories in parallel
      const [productRes, categoryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/products/all`),
        axios.get(`${API_BASE_URL}/api/admin/categories/all`), // Assumed endpoint
      ]);

      if (Array.isArray(productRes.data)) setProducts(productRes.data);
      if (Array.isArray(categoryRes.data)) setCategories(categoryRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Only refresh products after an update (categories rarely change)
  const fetchProductsOnly = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/products/all`
      );
      if (Array.isArray(response.data)) setProducts(response.data);
    } catch (error) {
      console.error("Error refreshing products:", error);
    }
  };

  // --- Image Helper ---
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

  // --- Image Picker ---
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setFormImage({
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // --- Open Modals ---
  const openAddModal = () => {
    setModalMode("add");
    setActiveProduct(null);

    // Reset Form
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormActualPrice("");
    setFormDiscount("0");
    setFormStock("");
    setFormImage(null);

    // Default to first available category from backend data
    setFormCategoryId(categories.length > 0 ? categories[0].cid : null);

    setModalVisible(true);
  };

  const openEditModal = (product: ProductData) => {
    setModalMode("edit");
    setActiveProduct(product);

    // Pre-fill Form
    setFormName(product.pname);
    setFormDescription(product.description || "");
    setFormPrice(String(product.price));
    setFormActualPrice(String(product.actualPrice));
    setFormDiscount(String(product.discount));
    setFormStock(String(product.stockQuantity));
    setFormCategoryId(product.category?.cid || null);

    setFormImage({ uri: getImageUrl(product.imagePath), isRemote: true });
    setModalVisible(true);
  };

  // --- Submit Logic (Create or Update) ---
  // --- Submit Logic (Create or Update) ---
  const handleSubmit = async () => {
    if (!formName || !formPrice || !formStock || !formCategoryId) {
      Alert.alert(
        "Missing Fields",
        "Please fill in Name, Price, Stock, and Category."
      );
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      // Find the full category object
      const selectedCategoryObj = categories.find(
        (c) => c.cid === formCategoryId
      );

      const productData = {
        pname: formName,
        description: formDescription,
        price: parseFloat(formPrice),
        actualPrice: parseFloat(formActualPrice) || parseFloat(formPrice),
        discount: parseFloat(formDiscount) || 0,
        stockQuantity: parseInt(formStock),
        category: selectedCategoryObj,
      };

      // 1. Append JSON Data
      if (isWeb) {
        // Web: Needs Blob to set content-type
        formData.append(
          "product",
          new Blob([JSON.stringify(productData)], { type: "application/json" })
        );
      } else {
        // Mobile: Send as string.
        // IMPORTANT: Requires the Backend change mentioned above to accept 'String' instead of 'Product'
        formData.append("product", JSON.stringify(productData));
      }

      // 2. Handle Image
      if (formImage && !formImage.isRemote) {
        const uniqueName = `prod_${Date.now()}.jpg`;

        if (isWeb) {
          const res = await fetch(formImage.uri);
          const blob = await res.blob();
          formData.append("image", blob, uniqueName);
        } else {
          // Mobile Image Handling
          // Android requires a complete file object with uri, name, and type
          formData.append("image", {
            uri: formImage.uri, // Check if this needs 'file://' prefix (Expo usually handles it)
            name: uniqueName,
            type: "image/jpeg", // Hardcode or use formImage.type
          } as any);
        }
      }

      let url = "";
      let method = "";

      if (modalMode === "add") {
        url = `${API_BASE_URL}/api/admin/products/addimage`;
        method = "POST";
      } else {
        url = `${API_BASE_URL}/api/admin/products/update/${activeProduct?.pid}`;
        method = "PUT";
      }

      console.log("Sending to:", url); // Debug Log

      const response = await axios({
        method: method,
        url: url,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data", // Try adding this to match Admindashboard
          Accept: "application/json",
        },
        transformRequest: (data) => data, // Prevent Axios from stringifying FormData
      });

      if (response.status === 200 || response.status === 201) {
        const successMsg =
          modalMode === "add" ? "Product Added!" : "Product Updated!";
        if (isWeb) alert(successMsg);
        else Alert.alert("Success", successMsg);

        setModalVisible(false);
        setLastUpdated(Date.now());
        await fetchProductsOnly();
      }
    } catch (error: any) {
      console.error("Submit Error:", error);
      let msg = "Operation failed.";
      if (error.response?.data) {
        msg =
          error.response.data.message ||
          (typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data));
      } else if (error.message) {
        msg = error.message;
      }

      if (isWeb) alert(`Error: ${msg}`);
      else Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = (pid: number) => {
    // The actual deletion logic
    const performDelete = async () => {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/admin/products/delete/${pid}`
        );

        if (response.status === 200 || response.status === 204) {
          // Remove the product from local state
          setProducts((prev) => prev.filter((p) => p.pid !== pid));

          if (isWeb) alert("Success: Product deleted");
          else Alert.alert("Success", "Product deleted");
        }
      } catch (error: any) {
        console.error("Delete Error:", error);
        let errorMessage = "Could not delete product.";
        if (error.response?.data) {
          errorMessage =
            typeof error.response.data === "string"
              ? error.response.data
              : error.response.data.message || errorMessage;
        }

        if (isWeb) alert(`Error: ${errorMessage}`);
        else Alert.alert("Error", errorMessage);
      }
    };

    // Confirmation dialog logic matching your Admindashboard pattern
    if (isWeb) {
      if (
        window.confirm(
          "Delete Product: Are you sure? This action cannot be undone."
        )
      ) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Delete Product",
        "Are you sure? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: performDelete },
        ]
      );
    }
  };

  // Add logout handler logic
  const handleLogout = () => {
    const performLogout = async () => {
      try {
        // 1. CLEAR AUTH DATA
        // If you use AsyncStorage, clear it here:
        //await AsyncStorage.removeItem('userToken');
        await AsyncStorage.clear();

        console.log("User logged out");

        // 2. REDIRECT TO LOGIN
        // 'replace' ensures the user cannot go 'back' to the admin panel
        router.replace("/");
      } catch (error) {
        console.error("Logout Error:", error);
      }
      // Add your navigation or authentication clearing logic here
      // e.g., router.replace('/login');
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

  // --- Grouping Logic (Purely Visual) ---
  const groupedProducts = useMemo(() => {
    const filtered = products.filter(
      (p) =>
        p.pname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.cname.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped: { [key: string]: ProductData[] } = {};
    filtered.forEach((product) => {
      const groupName = product.category?.cname || "Uncategorized";
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(product);
    });
    return grouped;
  }, [products, searchQuery]);

  return (
    // <SafeAreaView className="flex-1 bg-pink-100">
    <SafeAreaView className="flex-1 bg-pink-100" edges={["top"]}>
      {/* ----------------- HEADER ----------------- */}
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
        <View className="flex-1 mx-4">
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Ionicons name="search" size={18} color="gray" />
            <TextInput
              placeholder="Search..."
              className="flex-1 ml-2 text-base text-gray-700 outline-none"
              placeholderTextColor="gray"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
        {/* <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="black" /></TouchableOpacity> */}
        {/* Replace the bell icon line with this block */}
        <View style={{ position: "relative", zIndex: 1000 }}>
          <TouchableOpacity
            onPress={() => setProfileMenuVisible(!profileMenuVisible)}
            className="bg-slate-100 p-1 rounded-full border border-gray-100"
          >
            <Ionicons name="person-circle-outline" size={28} color="#8b008b" />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {profileMenuVisible && (
            <View
              className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-2xl w-44 z-50 overflow-hidden"
              style={{
                elevation: 10, // Shadow for Android
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
              <View>
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
            </View>
          )}
        </View>
      </View>

      {/* ----------------- LIST CONTENT ----------------- */}
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8b008b"]} // Android spinner color
            tintColor="#8b008b"
          />
        }
      >
        <View className="p-4 pb-24">
          {/* <Text className="text-lg font-bold text-gray-800 mb-6">
              {searchQuery ? `Results for "${searchQuery}"` : 'Inventory Overview'}
            </Text>*/}

          {/* Replace the existing Text component with this block */}
          <View className="flex-row items-center justify-between mb-6 pb-2 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <View className="bg-purple-100 p-2 rounded-lg">
                <Ionicons name="cube-outline" size={20} color="#8b008b" />
              </View>
              <View>
                <Text className="text-xl font-extrabold text-gray-900 tracking-tight">
                  {searchQuery ? "Search Results" : "Inventory Overview"}
                </Text>
                {!searchQuery && (
                  <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Manage your products
                  </Text>
                )}
              </View>
            </View>

            {/* Optional: Add a small total count badge if you have the products length */}
            {!searchQuery && (
              <View className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                <Text className="text-[10px] font-bold text-gray-500">
                  {products.length} Total
                </Text>
              </View>
            )}
          </View>

          {loading ? (
            <View className="h-64 justify-center items-center">
              <ActivityIndicator size="large" color="#8b008b" />
            </View>
          ) : (
            <View>
              {Object.keys(groupedProducts).map((categoryName) => (
                <View key={categoryName} className="mb-8">
                  <View className="flex-row justify-between items-center border-b border-gray-100 pb-2 mb-4">
                    <Text className="text-xl font-bold text-gray-800">
                      {categoryName}
                    </Text>
                    <Text className="text-xs font-bold text-[#8b008b] bg-purple-50 px-2 py-1 rounded-md">
                      {groupedProducts[categoryName].length} items
                    </Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 16 }}
                  >
                    {groupedProducts[categoryName].map((product) => (
                      <View
                        key={product.pid}
                        className="w-40 mr-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                      >
                        <View className="h-32 bg-white justify-center items-center relative p-2">
                          <Image
                            source={{ uri: getImageUrl(product.imagePath) }}
                            className="w-full h-full"
                            resizeMode="contain"
                          />
                          {/* <View
                            className={`absolute top-1 left-1 px-1.5 py-0.5 rounded ${product.stockQuantity < 5 ? "bg-red-100" : "bg-green-100"}`}
                          >
                            <Text
                              className={`text-[8px] font-bold ${product.stockQuantity < 5 ? "text-red-700" : "text-green-700"}`}
                            >
                              Stock: {product.stockQuantity}
                            </Text>
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

                        <View className="px-3 pb-3 pt-2 border-t border-gray-100 bg-gray-50">
                          <Text
                            className="font-semibold text-gray-800 text-xs mb-1 h-8"
                            numberOfLines={2}
                          >
                            {product.pname}
                          </Text>
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="font-bold text-sm text-[15px] text-gray-900">
                              ₹{product.actualPrice}
                            </Text>
                            <TouchableOpacity
                              onPress={() => openEditModal(product)}
                            >
                              <Ionicons
                                name="create-outline"
                                size={18}
                                color="#2563eb"
                              />
                            </TouchableOpacity>

                            {/* ADDED DELETE BUTTON */}
                            <TouchableOpacity
                              onPress={() => handleDeleteProduct(product.pid)}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={18}
                                color="#dc2626"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ))}
              {Object.keys(groupedProducts).length === 0 && (
                <View className="w-full py-10 items-center">
                  <Text className="text-gray-400 mt-2">No products found.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ----------------- FLOATING ACTION BUTTON (ADD) ----------------- */}
      <TouchableOpacity
        onPress={openAddModal}
        className="absolute bottom-6 right-6 bg-[#8b008b] w-14 h-14 rounded-full justify-center items-center shadow-lg z-50"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* ----------------- UNIFIED PRODUCT MODAL ----------------- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-2xl h-[90%]">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                {modalMode === "add" ? "Add New Product" : "Edit Product"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="gray" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 1. Image Picker */}
              <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                Product Image
              </Text>
              <TouchableOpacity
                onPress={pickImage}
                className="h-40 border-2 border-dashed border-gray-300 rounded-xl justify-center items-center bg-gray-50 mb-6 overflow-hidden"
              >
                {formImage ? (
                  <Image
                    source={{ uri: formImage.uri }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="items-center">
                    <Ionicons
                      name="cloud-upload-outline"
                      size={32}
                      color="gray"
                    />
                    <Text className="text-gray-400 text-xs mt-1">
                      Tap to upload
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* 2. Category Selector (Using Fetched Categories) */}
              <Text className="text-xs font-bold text-gray-500 mb-2 uppercase">
                Category
              </Text>
              {categories.length === 0 ? (
                <View className="p-4 bg-gray-50 rounded-lg mb-4">
                  <Text className="text-gray-400 text-xs italic">
                    No categories available. Please add categories in backend.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.cid}
                      onPress={() => setFormCategoryId(cat.cid)}
                      className={`px-4 py-2 rounded-full mr-2 border ${formCategoryId === cat.cid ? "bg-[#8b008b] border-[#8b008b]" : "bg-white border-gray-300"}`}
                    >
                      <Text
                        className={`font-semibold text-xs ${formCategoryId === cat.cid ? "text-white" : "text-gray-600"}`}
                      >
                        {cat.cname}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* 3. Basic Info */}
              <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                Name
              </Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                className="border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white"
                placeholder="Product Name"
              />

              <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                Description
              </Text>
              <TextInput
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={3}
                className="border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-white"
                textAlignVertical="top"
                placeholder="Details about product..."
              />

              {/* 4. Pricing Row */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                    Selling Price (₹)
                  </Text>
                  <TextInput
                    value={formPrice}
                    onChangeText={setFormPrice}
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                    placeholder="0"
                  />
                </View>
              </View>

              {/* 5. Stock & Discount Row */}
              <View className="flex-row gap-4 mb-8">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                    Stock Qty
                  </Text>
                  <TextInput
                    value={formStock}
                    onChangeText={setFormStock}
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                    placeholder="0"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">
                    Discount %
                  </Text>
                  <TextInput
                    value={formDiscount}
                    onChangeText={setFormDiscount}
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                    placeholder="0"
                  />
                </View>
              </View>

              {/* 6. Action Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className={`py-4 rounded-xl items-center ${submitting ? "bg-purple-300" : "bg-[#8b008b]"}`}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    {modalMode === "add" ? "Create Product" : "Save Changes"}
                  </Text>
                )}
              </TouchableOpacity>

              <View className="h-20" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Customizations;
