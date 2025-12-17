import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the API URL base
const API_BASE_URL = 'http://192.168.0.200:8080';

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
  const isWeb = Platform.OS === 'web';
  
  // --- Data State ---
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State to force image refresh (cache busting)
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // --- Add/Edit Category Modal State ---
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchCategories(), 
      fetchProducts()
    ]);
    setLoading(false);
    setLastUpdated(Date.now()); // Refresh images after fetch
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/categories/all`);
      if (Array.isArray(response.data)) setCategories(response.data);
    } catch (error) { console.error("Error fetching categories:", error); }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/products/all`);
      if (Array.isArray(response.data)) setProducts(response.data);
    } catch (error) { console.error("Error fetching products:", error); }
  };

  // --- Image Picker Helper ---
  const pickImage = async (setFunction: Function) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      if (isWeb) alert("Permission to access camera roll is required!");
      else Alert.alert("Permission required", "Permission to access camera roll is required!");
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
    if (!path) return 'https://via.placeholder.com/150';
    
    let finalUrl = path;
    if (!path.startsWith('http')) {
        if (path.includes('C:/') || path.includes('C:\\')) {
            const parts = path.split(/[/\\]/);
            const filename = parts[parts.length - 1];
            finalUrl = `${API_BASE_URL}/${filename}`; 
        } else {
            finalUrl = `${API_BASE_URL}/${path}`; 
        }
    }
    // Append cache buster to force refresh
    return `${finalUrl}?t=${lastUpdated}`;
  };

  // --- Category Actions (Edit/Delete) ---

  const handleDeleteCategory = (cid: number) => {
    if (!cid) {
        if (isWeb) alert("Error: Invalid Category ID");
        else Alert.alert("Error", "Invalid Category ID");
        return;
    }

    // Logic to run after confirmation
    const performDelete = async () => {
        try {
            console.log(`Deleting Category ID: ${cid}`);
            const response = await axios.delete(`${API_BASE_URL}/api/admin/categories/delete/${cid}`);
            
            if (response.status === 200 || response.status === 204) {
                setCategories(prev => prev.filter(c => c.cid !== cid));
                if (isWeb) alert("Success: Category deleted");
                else Alert.alert("Success", "Category deleted");
            } else {
                if (isWeb) alert(`Failed: Server returned status: ${response.status}`);
                else Alert.alert("Failed", `Server returned status: ${response.status}`);
            }
        } catch (error: any) {
            console.error("Delete Error Full:", error);
            let errorMessage = "Could not delete category.";
            
            if (error.response) {
                const serverData = error.response.data;
                if (typeof serverData === 'string') {
                    errorMessage = `Server Error: ${serverData}`;
                } else if (serverData && serverData.message) {
                    errorMessage = `Server Message: ${serverData.message}`;
                } else {
                    errorMessage = `Server Error (${error.response.status})`;
                }
                if (error.response.status === 500) {
                    errorMessage += "\n\n(Hint: Does this category contain products?)";
                }
            } else if (error.request) {
                errorMessage = "Network Error: Server did not respond.";
            } else {
                errorMessage = error.message;
            }

            if (isWeb) alert(`Delete Failed: ${errorMessage}`);
            else Alert.alert("Delete Failed", errorMessage);
        }
    };

    // Platform specific confirmation
    if (isWeb) {
        if (window.confirm("Delete Category: Are you sure? This will remove the category.")) {
            performDelete();
        }
    } else {
        Alert.alert("Delete Category", "Are you sure? This will remove the category.", [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Delete", 
              style: "destructive", 
              onPress: performDelete
            }
        ]);
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
      setNewCategoryName('');
      setNewCategoryImage(null);
  };

  // --- Add/Update Category Function ---
  const handleSaveCategory = async () => {
    if (!newCategoryName || !newCategoryImage) {
      if (isWeb) alert("Validation Error: Please provide both a name and an image.");
      else Alert.alert("Validation Error", "Please provide both a name and an image.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      const categoryData = { cname: newCategoryName };

      if (isWeb) {
        const jsonBlob = new Blob([JSON.stringify(categoryData)], { type: 'application/json' });
        formData.append('category', jsonBlob);
      } else {
        formData.append('category', JSON.stringify(categoryData));
      }

      const isNewImage = newCategoryImage && !newCategoryImage.isRemote;

      if (isNewImage) {
        const uniqueName = `category_${Date.now()}.jpg`; 
        
        if (isWeb) {
            const res = await fetch(newCategoryImage.uri);
            const blob = await res.blob();
            formData.append('image', blob, uniqueName);
        } else {
            const uriParts = newCategoryImage.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            const imageFile = {
                uri: newCategoryImage.uri,
                name: uniqueName, 
                type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
            } as any;
            formData.append('image', imageFile);
        }
      } 

      let url = `${API_BASE_URL}/api/admin/categories/addimage/add`;
      let method = 'POST';

      if (editingCategory) {
          url = `${API_BASE_URL}/api/admin/categories/update/${editingCategory.cid}`;
          method = 'PUT';
      }

      const response = await axios({
          method: method,
          url: url,
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
          transformRequest: (data) => data,
      });

      if (response.status === 200 || response.status === 201) {
        const msg = `Category ${editingCategory ? 'updated' : 'added'} successfully!`;
        if (isWeb) alert(`Success: ${msg}`);
        else Alert.alert("Success", msg);

        closeModal();
        await fetchCategories(); 
        setLastUpdated(Date.now()); 
      }
    } catch (error: any) {
      console.error("Save Error:", error);
      let errorMessage = "Something went wrong.";
      if (error.response) {
        errorMessage = `Server Error: ${JSON.stringify(error.response.data)}`;
      }
      if (isWeb) alert(`Failed: ${errorMessage}`);
      else Alert.alert("Failed", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Group products
  const groupedProducts = (() => {
    const grouped: { [key: string]: ProductData[] } = {};
    products.forEach((product) => {
      const groupName = product.category?.cname || 'Other';
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(product);
    });
    return grouped;
  })();

  const handleDeleteProduct = (pid: number) => {
    // Logic to run after confirmation
    const performDelete = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/api/admin/products/${pid}`);
            setProducts(prev => prev.filter(p => p.pid !== pid));
            if (isWeb) alert("Success: Product deleted");
            else Alert.alert("Success", "Product deleted");
        } catch (err) {
            console.log(err);
            if (isWeb) alert("Error: Could not delete product");
            else Alert.alert("Error", "Could not delete product");
        }
    };

    // Platform specific confirmation
    if (isWeb) {
        if (window.confirm("Delete Product: Are you sure you want to delete this product?")) {
            performDelete();
        }
    } else {
        Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Delete", 
              style: "destructive", 
              onPress: performDelete 
            }
        ]);
    }
  };

  const handleEditProduct = (pid: number) => {
    console.log("Edit product", pid);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* ----------------- ADMIN HEADER ----------------- */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white ${Platform.OS === 'android' ? 'pt-2' : 'py-4'}`}>
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-extrabold text-[#8b008b] tracking-tighter">dailydrop</Text>
          <View className="bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
             <Text className="text-[10px] font-bold text-gray-500 uppercase">Admin</Text>
          </View>
        </View>
        <View className="flex-1 mx-4">
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Ionicons name="search" size={18} color="gray" />
            <TextInput 
              placeholder="Search inventory..." 
              className="flex-1 ml-2 text-base text-gray-700 outline-none"
              placeholderTextColor="gray"
            />
          </View>
        </View>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="black" /></TouchableOpacity>
          <TouchableOpacity><Ionicons name="settings-outline" size={24} color="black" /></TouchableOpacity>
          <TouchableOpacity className="bg-slate-100 p-1 rounded-full"><Ionicons name="person-circle-outline" size={28} color="#8b008b" /></TouchableOpacity>
        </View>
      </View>

      {/* ----------------- MAIN CONTENT ----------------- */}
      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        {loading && (
             <View className="h-24 justify-center items-center">
                 <ActivityIndicator size="large" color="#8b008b" />
             </View>
        )}

        {/* 1. CATEGORIES */}
        {!loading && (
          <View className="pt-6 pb-2">
              <Text className="px-4 mb-3 text-xs font-bold text-gray-400 uppercase">Active Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }} className="flex-row">
                  {categories.map((item) => (
                      <View key={item.cid} className="mr-4 items-center w-[80px]">
                          
                          {/* Category Card */}
                          <View className="w-20 h-20 bg-slate-50 rounded-xl items-center justify-center mb-2 overflow-hidden border border-slate-200 shadow-sm">
                              <Image source={{ uri: getImageUrl(item.cphoto) }} className="w-12 h-12" resizeMode="contain" />
                          </View>
                          
                          {/* Name */}
                          <Text className="text-center text-[11px] font-bold text-gray-700 leading-3 mb-2 h-6" numberOfLines={2}>{item.cname}</Text>
                          
                          {/* Action Buttons */}
                          <View className="flex-row gap-2">
                              <TouchableOpacity onPress={() => handleEditCategory(item)} className="bg-blue-50 p-1.5 rounded-md border border-blue-100">
                                  <Ionicons name="pencil" size={12} color="#2563eb" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteCategory(item.cid)} className="bg-red-50 p-1.5 rounded-md border border-red-100">
                                  <Ionicons name="trash" size={12} color="#dc2626" />
                              </TouchableOpacity>
                          </View>

                      </View>
                  ))}
                  
                  {/* ADD NEW CATEGORY BUTTON */}
                  <TouchableOpacity 
                    onPress={() => setModalVisible(true)} 
                    className="mr-4 items-center w-[70px] justify-start mt-2"
                  >
                      <View className="w-16 h-16 bg-white rounded-xl items-center justify-center mb-1 overflow-hidden border border-dashed border-gray-300">
                          <Ionicons name="add" size={24} color="gray" />
                      </View>
                      <Text className="text-center text-[10px] font-bold text-gray-400 leading-3">Add New</Text>
                  </TouchableOpacity>
              </ScrollView>
          </View>
        )}

        {/* 2. OFFERS */}
        <View className="py-2">
            <View className="px-4 mb-2 flex-row justify-between">
                <Text className="text-xs font-bold text-gray-400 uppercase">Live Offers</Text>
                <Text className="text-[10px] text-[#8b008b]">Manage Banners</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }} className="flex-row">
               <OfferCardChristmas isWeb={isWeb} />
               <OfferCardPurple isWeb={isWeb} />
            </ScrollView>
        </View>

        {/* 3. INVENTORY */}
        {!loading && Object.keys(groupedProducts).map((categoryName) => (
            <View key={categoryName} className="pb-8 pt-4">
                <View className="px-4 mb-3 flex-row justify-between items-center border-t border-gray-100 pt-4">
                    <Text className="text-lg font-bold text-gray-800">{categoryName}</Text>
                    <TouchableOpacity className="flex-row items-center bg-gray-100 px-2 py-1 rounded">
                         <Text className="text-[10px] text-gray-600 mr-1">Manage</Text>
                         <Ionicons name="options-outline" size={12} color="gray" />
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }} className="flex-row">
                    {groupedProducts[categoryName].map((product) => (
                        <View key={product.pid} className="w-40 mr-4 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <View className="h-28 bg-white justify-center items-center relative p-2">
                                <Image source={{ uri: getImageUrl(product.imagePath) }} className="w-full h-full" resizeMode="contain" />
                                <View className={`absolute top-1 left-1 px-1.5 py-0.5 rounded ${product.stockQuantity < 5 ? 'bg-red-100' : 'bg-green-100'}`}>
                                    <Text className={`text-[8px] font-bold ${product.stockQuantity < 5 ? 'text-red-700' : 'text-green-700'}`}>Stock: {product.stockQuantity}</Text>
                                </View>
                            </View>
                            <View className="px-3 pb-3 pt-1 border-t border-gray-100 bg-gray-50">
                                <Text className="font-semibold text-gray-800 text-xs mb-1 h-8" numberOfLines={2}>{product.pname}</Text>
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="font-bold text-sm text-gray-900">₹{product.actualPrice}</Text>
                                    <Text className="text-[10px] text-gray-400 line-through">₹{product.price}</Text>
                                </View>
                                
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        ))}

        <View className="p-4 pb-20">
            <Text className="text-gray-300 text-xs text-center">Admin Panel v1.0</Text>
        </View>

      </ScrollView>

      {/* ----------------- ADD/EDIT CATEGORY MODAL ----------------- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">{editingCategory ? 'Edit Category' : 'Add New Category'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close-circle" size={28} color="gray" />
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Category Name</Text>
            <TextInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g., Snacks, Beverages"
              className="border border-gray-300 rounded-xl px-4 py-3 mb-6 text-base bg-gray-50"
            />

            {/* Image Picker */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Category Icon</Text>
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
                  <Text className="text-gray-400 text-xs mt-1">Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSaveCategory}
              disabled={submitting}
              className={`py-4 rounded-xl items-center ${submitting ? 'bg-purple-300' : 'bg-[#8b008b]'}`}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">{editingCategory ? 'Update Category' : 'Create Category'}</Text>
              )}
            </TouchableOpacity>
            
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// --- Offer Components ---
const OfferCardChristmas = ({ isWeb }: { isWeb: boolean }) => (
    <View className={`${isWeb ? 'flex-1 h-48' : 'w-72 h-40 mr-4'} bg-red-600 rounded-xl p-4 justify-between shadow-sm overflow-hidden relative opacity-90`}>
        <View className="absolute right-0 bottom-0 opacity-20"><Ionicons name="gift" size={isWeb ? 140 : 100} color="white" /></View>
        <View className="absolute left-10 top-0 opacity-10"><Ionicons name="snow" size={60} color="white" /></View>
        <View>
            <Text className="text-white font-bold text-lg">Christmas Special</Text>
            <View className="flex-row items-center mt-1"><Text className="text-white text-xs">Flat </Text><View className="bg-white px-1 rounded mx-1"><Text className="text-red-600 font-bold text-xs">50% OFF</Text></View></View>
            <Text className="text-red-100 text-[10px] mt-1">Banner Preview</Text>
        </View>
        <View className="bg-white/20 self-start px-2 py-1 rounded mt-2"><Text className="text-white text-[10px]">Active</Text></View>
    </View>
);
const OfferCardPurple = ({ isWeb }: { isWeb: boolean }) => (
    <View className={`${isWeb ? 'flex-1 h-48' : 'w-72 h-40 mr-4'} bg-purple-100 rounded-xl p-4 justify-between shadow-sm border border-purple-200 opacity-90`}>
        <Text className="text-purple-800 font-bold text-[10px] tracking-widest text-center">DAILYDROP EXPERIENCE</Text>
        <View className="flex-row justify-around items-center mt-2">
            <View className="bg-white p-2 rounded-lg shadow-sm items-center flex-1 mr-2 py-3"><Ionicons name="wallet-outline" size={20} color="#8b008b" /><Text className="text-[#8b008b] font-bold text-sm">₹0 FEES</Text></View>
            <View className="bg-white p-2 rounded-lg shadow-sm items-center flex-1 py-3"><Ionicons name="pricetag-outline" size={20} color="#8b008b" /><Text className="text-[#8b008b] font-bold text-[10px] text-center">LOWEST PRICES</Text></View>
        </View>
        <View className="bg-purple-200/50 self-center px-2 py-0.5 rounded mt-1"><Text className="text-purple-800 text-[9px]">Default Banner</Text></View>
    </View>
);

export default Admindashboard;