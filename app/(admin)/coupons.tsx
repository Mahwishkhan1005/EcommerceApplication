import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Interfaces ---
interface Coupon {
  code: string;
  description: string;
  value: number; // Matches existing interface
  active: boolean;
  maxDiscount: number;
  type: string;
}

const Coupons = () => {
  const isWeb = Platform.OS === "web";
  const API_URL = "http://192.168.0.215:8082/api/coupons";

  // --- State ---
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // --- Modal & Edit State ---
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [activeCouponCode, setActiveCouponCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newMaxDiscount, setNewMaxDiscount] = useState("");
  const [newType, setNewType] = useState("FLAT");
  const [newActive, setNewActive] = useState(true);

  // --- Fetch Data ---
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("AccessToken");
      const response = await axios.get(`${API_URL}/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        timeout: 10000,
      });

      if (Array.isArray(response.data)) {
        setCoupons(response.data);
      }
    } catch (error: any) {
      console.error("Fetch Error:", error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert("Unauthorized", "Session expired. Please login again.");
        router.replace("/");
        return;
      }
      const errorMsg = error.response?.data?.message || "Check network or server status.";
      if (isWeb) alert(`Error: ${errorMsg}`);
      else Alert.alert("Backend Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- Modal Handlers ---
  const openAddModal = () => {
    setModalMode("add");
    setActiveCouponCode(null);
    setNewCode("");
    setNewDescription("");
    setNewValue("");
    setNewMaxDiscount("");
    setNewType("FLAT");
    setNewActive(true);
    setAddModalVisible(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setModalMode("edit");
    setActiveCouponCode(coupon.code);
    setNewCode(coupon.code);
    setNewDescription(coupon.description);
    setNewValue(String(coupon.value));
    setNewMaxDiscount(String(coupon.maxDiscount));
    setNewType(coupon.type);
    setNewActive(coupon.active);
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setModalMode("add");
    setActiveCouponCode(null);
    setNewCode("");
    setNewDescription("");
    setNewValue("");
    setNewMaxDiscount("");
    setNewType("FLAT");
    setNewActive(true);
  };

  // --- Save Logic (Create or Update) ---
  const handleSaveCoupon = async () => {
    if (!newCode || !newDescription || !newValue || !newMaxDiscount) {
      if (isWeb) alert("Please fill all fields");
      else Alert.alert("Error", "Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("AccessToken");
      const couponData = {
        code: newCode,
        description: newDescription,
        value: parseFloat(newValue),
        active: newActive,
        maxDiscount: parseFloat(newMaxDiscount),
        type: newType,
      };

      let response;
      if (modalMode === "add") {
        // Create endpoint
        response = await axios.post(`${API_URL}/add`, couponData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        // Update endpoint: http://192.168.0.210:8082/api/coupons/update/{code}
        response = await axios.put(`${API_URL}/update/${activeCouponCode}`, couponData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      if (response.status === 200 || response.status === 201) {
        const successMsg = modalMode === "add" ? "Coupon Added Successfully!" : "Coupon Updated Successfully!";
        if (isWeb) alert(successMsg);
        else Alert.alert("Success", successMsg);

        closeAddModal();
        fetchCoupons();
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Operation failed";
      if (isWeb) alert(msg);
      else Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- DELETE FUNCTIONALITY ---
  const handleDeleteCoupon = async (code: string) => {
    try {
      const token = await AsyncStorage.getItem("AccessToken");
      const response = await axios.delete(`${API_URL}/delete/${code}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 204) {
        if (isWeb) alert(`Coupon ${code} deleted!`);
        else Alert.alert("Success", `Coupon ${code} deleted!`);
        
        setCoupons((prev) => prev.filter((c) => c.code !== code));
      }
    } catch (error: any) {
      console.error("Delete Error:", error);
      const msg = error.response?.data?.message || "Could not delete coupon.";
      if (isWeb) alert(msg);
      else Alert.alert("Error", msg);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCoupons();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      await AsyncStorage.clear();
      router.replace("/");
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

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* ----------------- HEADER ----------------- */}
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-pink-100 relative"
        style={{ zIndex: 1000, elevation: 4 }}
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-extrabold text-[#8b008b] tracking-tighter">
            dailydrop
          </Text>
          <View className="bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
            <Text className="text-[10px] font-bold text-gray-500 uppercase">Admin</Text>
          </View>
        </View>

        <View className="flex-1 mx-4">
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <Ionicons name="search" size={18} color="gray" />
            <TextInput
              placeholder="Search coupons..."
              className="flex-1 ml-2 text-base text-gray-700"
              placeholderTextColor="gray"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={{ position: "relative" }}>
          <TouchableOpacity
            onPress={() => setProfileMenuVisible(!profileMenuVisible)}
            className="bg-slate-100 p-1 rounded-full border border-gray-100"
          >
            <Ionicons name="person-circle-outline" size={28} color="#8b008b" />
          </TouchableOpacity>

          {profileMenuVisible && (
            <View
              className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-2xl w-44 overflow-hidden"
              style={{ elevation: 10, zIndex: 2000 }}
            >
              <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administrator</Text>
                <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>admin@dailydrop.com</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setProfileMenuVisible(false); handleLogout(); }}
                className="flex-row items-center px-4 py-3 active:bg-red-50"
              >
                <Ionicons name="log-out-outline" size={18} color="#dc2626" />
                <Text className="ml-3 text-sm font-bold text-red-600">Log Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ----------------- CONTENT AREA ----------------- */}
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8b008b"]} tintColor="#8b008b" />
        }
      >
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-6 pb-2 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <View className="bg-purple-100 p-2 rounded-lg">
                <Ionicons name="ticket-outline" size={20} color="#8b008b" />
              </View>
              <View>
                <Text className="text-xl font-extrabold text-gray-900 tracking-tight">Coupons Overview</Text>
                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Manage discount codes</Text>
              </View>
            </View>
            <View className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <Text className="text-[10px] font-bold text-gray-500">{filteredCoupons.length} Total</Text>
            </View>
          </View>

          {loading ? (
            <View className="h-64 justify-center items-center">
              <ActivityIndicator size="large" color="#8b008b" />
            </View>
          ) : filteredCoupons.length > 0 ? (
            <View className="flex-row flex-wrap justify-start gap-4">
              {filteredCoupons.map((coupon) => (
                <View
                  key={coupon.code}
                  className={`${isWeb ? "w-[31%]" : "w-full"} mb-4 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden`}
                >
                  <View className="p-4 flex-row justify-between items-start bg-purple-50/50">
                    <View className="flex-1 mr-2">
                      <View className="bg-[#8b008b] px-3 py-1 rounded-lg self-start mb-2">
                        <Text className="text-white font-bold text-sm tracking-widest">{coupon.code}</Text>
                      </View>
                      <Text className="text-xs text-gray-500 font-medium" numberOfLines={2}>{coupon.description}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-md ${coupon.active ? "bg-green-100" : "bg-red-100"}`}>
                      <Text className={`text-[10px] font-bold ${coupon.active ? "text-black-700" : "text-black-700"}`}>{coupon.active ? "ACTIVE" : "INACTIVE"}</Text>
                    </View>
                  </View>
                  
                  <View className="p-4 border-t border-gray-100">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-400 text-[10px] font-bold uppercase">Discount</Text>
                      <Text className="text-lg font-black text-gray-900">{coupon.type === "FLAT" ? `₹${coupon.value}` : `${coupon.value}%`}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-400 text-[10px] font-bold uppercase">Max Discount</Text>
                      <Text className="text-sm font-bold text-gray-700">₹{coupon.maxDiscount}</Text>
                    </View>
                  </View>

                  {/* ACTION BUTTONS WRAPPER */}
                  <View className="flex-row border-t border-gray-100">
                    <TouchableOpacity
                      onPress={() => openEditModal(coupon)}
                      className="flex-1 flex-row items-center justify-center py-4 border-r border-gray-100 active:bg-green-50"
                    >
                      <Ionicons name="create-outline" size={18} color="#16a34a" />
                      <Text className="ml-2 text-black text-xs font-bold uppercase tracking-wider">Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        const deleteAction = () => handleDeleteCoupon(coupon.code);
                        if (isWeb) {
                          if (window.confirm(`Delete ${coupon.code}?`)) deleteAction();
                        } else {
                          Alert.alert("Delete Coupon", `Are you sure you want to delete ${coupon.code}?`, [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: deleteAction },
                          ]);
                        }
                      }}
                      className="flex-1 flex-row items-center justify-center py-4 active:bg-red-50"
                    >
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                      <Text className="ml-2 text-black text-xs font-bold uppercase tracking-wider">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="h-64 justify-center items-center">
              <Ionicons name="ticket-outline" size={48} color="#cbd5e1" />
              <Text className="text-gray-400 mt-2 font-medium">No coupons found.</Text>
              <TouchableOpacity onPress={fetchCoupons} className="mt-4"><Text className="text-[#8b008b] font-bold">Retry Fetch</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ----------------- FLOATING ACTION BUTTON (ADD) ----------------- */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openAddModal}
        className="absolute bottom-6 right-6 bg-[#8b008b] w-16 h-16 rounded-full justify-center items-center shadow-xl"
        style={{ zIndex: 999, elevation: 8 }}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* ----------------- UNIFIED ADD/EDIT MODAL ----------------- */}
      <Modal animationType="slide" transparent={true} visible={addModalVisible} onRequestClose={closeAddModal} statusBarTranslucent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <View className="flex-1 justify-end bg-black/50">
            <Pressable className="absolute inset-0" onPress={closeAddModal} />
            <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-2xl h-[85%]" style={{ elevation: 20 }}>
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-900">
                  {modalMode === "add" ? "Add New Coupon" : "Edit Coupon"}
                </Text>
                <TouchableOpacity onPress={closeAddModal} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                  <Ionicons name="close-circle" size={28} color="gray" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">Coupon Code</Text>
                <TextInput 
                  value={newCode} 
                  onChangeText={setNewCode} 
                  editable={modalMode === "add"} // Primary key usually cannot change
                  className={`border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-gray-50 text-black ${modalMode === "edit" ? "opacity-50" : ""}`} 
                  placeholder="e.g. WELCOME100" 
                />

                <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">Description</Text>
                <TextInput value={newDescription} onChangeText={setNewDescription} className="border border-gray-300 rounded-xl px-4 py-3 mb-4 bg-gray-50 text-black" placeholder="Coupon details..." />

                <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">Discount Type</Text>
                <View className="flex-row gap-2 mb-4">
                  {["FLAT", "PERCENTAGE", "FREESHIP"].map((t) => (
                    <TouchableOpacity key={t} onPress={() => setNewType(t)} className={`flex-1 py-3 rounded-lg border items-center ${newType === t ? "bg-[#8b008b] border-[#8b008b]" : "bg-white border-gray-300"}`}>
                      <Text className={`text-xs font-bold ${newType === t ? "text-white" : "text-gray-600"}`}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className="flex-row gap-4 mb-4">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">Value ({newType === "FLAT" ? "₹" : "%"})</Text>
                    <TextInput value={newValue} onChangeText={setNewValue} keyboardType="numeric" className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-black" placeholder="0" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-gray-500 mb-1 uppercase">Max Discount (₹)</Text>
                    <TextInput value={newMaxDiscount} onChangeText={setNewMaxDiscount} keyboardType="numeric" className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-black" placeholder="1000" />
                  </View>
                </View>

                <View className="flex-row items-center justify-between py-4 border-y border-gray-100 mb-6">
                  <View><Text className="font-bold text-gray-800">Active Status</Text><Text className="text-xs text-gray-400 italic">Enable this coupon for users</Text></View>
                  <Switch value={newActive} onValueChange={setNewActive} trackColor={{ false: "#d1d5db", true: "#8b008b" }} thumbColor={"#ffffff"} />
                </View>

                <TouchableOpacity onPress={handleSaveCoupon} disabled={submitting} className={`py-4 rounded-xl items-center shadow-md ${submitting ? "bg-purple-300" : "bg-[#8b008b]"}`} style={{ elevation: 3 }}>
                  {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">
                    {modalMode === "add" ? "Create Coupon" : "Save Changes"}
                  </Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Coupons;