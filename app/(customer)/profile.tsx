import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { adressApi } from '../(utils)/axiosInstance';

const STORAGE_PROFILE = '@AS_profile';
const STORAGE_ADDRESS = '@saved_user_address';
const AUTH_TOKEN_KEY = '@auth_token';
const ORDER_HISTORY_KEY = '@order_history';

export default function AccountSidebar() {
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [addressesModalVisible, setAddressesModalVisible] = useState(false);
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [editName, setEditName] = useState('Guest User');
  const [editPhone, setEditPhone] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit Address Modal
  const [editAddressModalVisible, setEditAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Gym' | 'Others'>('Home');
  const [flatNo, setFlatNo] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverNumber, setReceiverNumber] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // Selected Order for Details
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetailsModalVisible, setOrderDetailsModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_PROFILE);
        if (raw) {
          const parsed = JSON.parse(raw);
          setEditName(parsed.name ?? 'Guest User');
          setEditPhone(parsed.phone ?? '');
        }
        await loadAddressesFromStorage();
        await loadOrderHistory();
      } catch (err) {
        console.warn('Failed to load data from storage:', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const loadAddressesFromStorage = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_ADDRESS);
      if (raw) {
        const address = JSON.parse(raw);
        if (address && Object.keys(address).length > 0) {
          setSavedAddresses([address]);
        } else {
          setSavedAddresses([]);
        }
      }
    } catch (err) {
      console.warn('failed to load addresses:', err);
      setSavedAddresses([]);
    }
  };

  const loadOrderHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(ORDER_HISTORY_KEY);
      if (raw) {
        const orders = JSON.parse(raw);
        setOrderHistory(Array.isArray(orders) ? orders : []);
      }
    } catch (err) {
      console.warn('failed to load order history:', err);
      setOrderHistory([]);
    }
  };

  const getAuthHeader = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        return {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
      }
      return { 'Content-Type': 'application/json' };
    } catch (e) {
      console.error('Error getting auth header:', e);
      return { 'Content-Type': 'application/json' };
    }
  };

  const fetchAddressesFromAPI = async () => {
    try {
      setLoadingAddresses(true);
      const headers = await getAuthHeader();

      const res = await adressApi.get('/address/all', { headers });
      const data = res.data;

      if (Array.isArray(data)) {
        setSavedAddresses(data);
        if (data.length > 0) {
          await AsyncStorage.setItem(STORAGE_ADDRESS, JSON.stringify(data[0]));
        }
      } else {
        await loadAddressesFromStorage();
      }
    } catch (error) {
      console.warn('API fetch error:', error);
      await loadAddressesFromStorage();
    } finally {
      setLoadingAddresses(false);
    }
  };

  const deleteAddressFromApi = async (id: string) => {
    try {
      setIsProcessing(true);
      console.log('Deleting address ID:', id);
      
      const response = await adressApi.delete(`/address/delete/${id}`);

      console.log('Delete response:', JSON.stringify(response, null, 2));
      
      if (response.status === 200 || response.status === 204) {
        return true;
      } else {
        throw new Error(`Delete failed with status: ${response.status}`);
      }

    } catch (e: any) {
      console.error('Delete API error:', e.response?.data || e.message || e);
      throw new Error(e.response?.data?.message || e.message || 'Failed to delete address');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateAddressToApi = async (addressData: any) => {
    try {
      setIsProcessing(true);
      const headers = await getAuthHeader();
      const res = await adressApi.put(
        `/address/update/${addressData.id}`,
        addressData,
        { headers }
      );

      if (res.status < 200 || res.status >= 300) {
        throw new Error(`server error: ${res.status}`);
      }
      return res.data;
    } catch (e: any) {
      console.error('updateAddressToApi error:', e.message || e);
      throw e;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAddress = (address: any) => {
    if (!address?.id) {
      Alert.alert('Error', 'Invalid address');
      return;
    }

    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddressFromApi(address.id);
            const updatedList = savedAddresses.filter((item: any) => item.id !== address.id);
            setSavedAddresses(updatedList);
            if (updatedList.length > 0) {
              await AsyncStorage.setItem(STORAGE_ADDRESS, JSON.stringify(updatedList[0]));
            } else {
              await AsyncStorage.removeItem(STORAGE_ADDRESS);
            }
            Alert.alert('Success', 'Address deleted successfully');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete address');
          }
        },
      },
    ]);
  };

  const openEditAddressModal = (address: any) => {
    if (!address) return;
    setEditingAddress(address);
    setAddressType(address.title || 'Home');
    setFlatNo(address.house || '');
    setBuildingName(address.street || '');
    setLandmark(address.landmark || '');
    setReceiverName(address.name || '');
    setReceiverNumber(address.phone || '');
    setCity(address.city || '');
    setStateName(address.state || '');
    setPincode(address.pincode || '');
    setEditAddressModalVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!flatNo.trim() || !buildingName.trim() || !city.trim() || !stateName.trim() || !pincode.trim()) {
      Alert.alert('Validation Error', 'Please fill all required fields(*)');
      return;
    }

    if (!editingAddress) {
      Alert.alert('Error', 'No address selected');
      return;
    }

    const addressPayload = {
      id: editingAddress.id,
      title: addressType,
      house: flatNo.trim(),
      street: buildingName.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      name: receiverName.trim(),
      phone: receiverNumber.trim(),
    };

    try {
      const updatedAddress = await updateAddressToApi(addressPayload);

      const updatedAddresses = savedAddresses.map((addr: any) =>
        addr.id === updatedAddress.id ? updatedAddress : addr
      );
      setSavedAddresses(updatedAddresses);

      const savedAddr = await AsyncStorage.getItem(STORAGE_ADDRESS);
      if (savedAddr) {
        const primaryAddr = JSON.parse(savedAddr);
        if (primaryAddr.id === updatedAddress.id) {
          await AsyncStorage.setItem(STORAGE_ADDRESS, JSON.stringify(updatedAddress));
        }
      }

      setEditAddressModalVisible(false);
      resetEditAddressForm();
      Alert.alert('Success', 'Address updated successfully');
    } catch (e: any) {
      console.error('Failed to update address:', e);
      Alert.alert('Error', `Failed to update address: ${e.message}`);
    }
  };

  const resetEditAddressForm = () => {
    setEditingAddress(null);
    setAddressType('Home');
    setFlatNo('');
    setBuildingName('');
    setLandmark('');
    setReceiverName('');
    setReceiverNumber('');
    setCity('');
    setStateName('');
    setPincode('');
  };

  const openOrdersModal = async () => {
    setLoadingOrders(true);
    setOrdersModalVisible(true);
    try {
      await loadOrderHistory();
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load order history');
    } finally {
      setLoadingOrders(false);
    }
  };

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setOrderDetailsModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#10b981'; // green
      case 'shipped':
        return '#3b82f6'; // blue
      case 'delivered':
        return '#8b5cf6'; // purple
      case 'cancelled':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const displayName = editName || 'Guest User';
  const displayPhone = editPhone || '';

  const openProfileModal = () => setProfileModalVisible(true);

  const openAddressesModal = async () => {
    setLoadingAddresses(true);
    setAddressesModalVisible(true);
    try {
      await fetchAddressesFromAPI();
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveProfile = async () => {
    const trimmedName = (editName || '').trim() || 'Guest User';
    const trimmedPhone = (editPhone || '').trim() || '';

    const payload = { name: trimmedName, phone: trimmedPhone };

    try {
      await AsyncStorage.setItem(STORAGE_PROFILE, JSON.stringify(payload));
      setEditName(trimmedName);
      setEditPhone(trimmedPhone);
      setProfileModalVisible(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      console.warn('Failed to save profile to storage:', err);
      Alert.alert('Error', 'Could not save profile. Try again.');
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return { fullAddress: 'No address available', cityStatePincode: '' };

    const parts: string[] = [];
    if (address.house) parts.push(address.house);
    if (address.street) parts.push(address.street);

    const fullAddress = parts.join(', ');
    const cityStatePincode = `${address.city || ''}, ${address.state || ''} - ${
      address.pincode || ''
    }`;

    return { fullAddress, cityStatePincode };
  };

  const clearOrderHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all order history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(ORDER_HISTORY_KEY);
              setOrderHistory([]);
              Alert.alert('Success', 'Order history cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear order history');
            }
          },
        },
      ]
    );
  };

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#e6005c" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{ alignItems: 'center' }}
          className="pt-8 pb-10 px-6 bg-white"
        >
          <View className="mb-4">
            <View className="w-30 h-30 rounded-full border-[3px] border-pink-500 items-center justify-center">
              <View className="w-24 h-24 rounded-full bg-pink-500 items-center justify-center">
                <Ionicons name="person" size={46} color="#ffefea" />
              </View>
            </View>
          </View>
          <Text className="text-lg font-bold text-neutral-800 mb-1">{displayName}</Text>
          {displayPhone ? (
            <Text className="text-sm text-neutral-500 mb-2">{displayPhone}</Text>
          ) : null}

          <View className="w-full mt-2">
            <ProfileRow 
              icon="bag-outline" 
              label="Order History" 
              onPress={openOrdersModal} 
            />
            <ProfileRow
              icon="location-outline"
              label="Shipping Address"
              onPress={openAddressesModal}
            />
            <ProfileRow
              icon="person-outline"
              label="Edit Profile"
              onPress={openProfileModal}
            />
            {/* <ProfileRow
              icon="cart-outline"
              label="Continue Shopping"
              onPress={() => router.push('/(customer)/home')}
            /> */}
          </View>
        </ScrollView>

        {/* Profile Modal */}
        <Modal
          visible={profileModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setProfileModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-5">
            <View className="w-full max-w-md bg-white p-5">
              <Text className="text-lg font-bold text-neutral-900 mb-2">
                Edit Profile
              </Text>

              <Text className="text-sm text-neutral-500 mt-1">Name</Text>
              <TextInput
                className="border border-gray-200 mt-1 py-2 px-3"
                value={editName}
                onChangeText={setEditName}
                placeholder="Name"
              />

              <Text className="text-sm text-neutral-500 mt-3">Phone</Text>
              <TextInput
                className="border border-gray-200 mt-1 py-2 px-3"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="Phone"
              />

              <View className="flex-row justify-between mt-4">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 py-3 mr-2 items-center"
                  onPress={() => setProfileModalVisible(false)}
                >
                  <Text className="font-semibold text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-pink-500 py-3 ml-2 items-center"
                  onPress={handleSaveProfile}
                >
                  <Text className="font-bold text-white">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Order History Modal */}
        <Modal
          visible={ordersModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setOrdersModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-5">
            <View className="w-full max-w-md bg-white p-5 max-h-[80%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-neutral-900">
                  Order History ({orderHistory.length})
                </Text>
                <View className="flex-row items-center">
                  {orderHistory.length > 0 && (
                    <TouchableOpacity
                      onPress={clearOrderHistory}
                      className="mr-3 p-1"
                      disabled={isProcessing}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => setOrdersModalVisible(false)}
                    className="p-1"
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              {loadingOrders ? (
                <View className="items-center justify-center py-10">
                  <ActivityIndicator size="large" color="#e6005c" />
                  <Text className="text-sm text-neutral-500 mt-3">
                    Loading orders...
                  </Text>
                </View>
              ) : orderHistory.length > 0 ? (
                <FlatList
                  data={orderHistory}
                  keyExtractor={(item: any, index) => 
                    item.orderId ? item.orderId.toString() : index.toString()
                  }
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 8 }}
                  renderItem={({ item }: any) => (
                    <TouchableOpacity
                      className="bg-white border border-gray-200 p-4 mb-3 rounded-lg shadow-sm"
                      onPress={() => openOrderDetails(item)}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="font-bold text-neutral-800">
                          Order #{item.orderId}
                        </Text>
                        <View className="px-2 py-1 rounded" style={{ backgroundColor: getStatusColor(item.status) + '20' }}>
                          <Text className="text-xs font-semibold" style={{ color: getStatusColor(item.status) }}>
                            {item.status}
                          </Text>
                        </View>
                      </View>
                      
                      <Text className="text-sm text-neutral-600 mb-1">
                        {formatDate(item.orderDate)} • {formatTime(item.orderDate)}
                      </Text>
                      
                      <View className="flex-row justify-between items-center mt-2">
                        <Text className="text-sm text-neutral-500">
                          {item.items.length} item{item.items.length > 1 ? 's' : ''}
                        </Text>
                        <Text className="font-bold text-neutral-900">
                          ₹{item.totalAmount}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text className="text-xs text-neutral-500 ml-1 flex-1" numberOfLines={1}>
                          {item.address?.city || 'Location not specified'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View className="items-center justify-center py-10">
                      <Ionicons name="bag-outline" size={48} color="#ccc" />
                      <Text className="text-base text-neutral-500 mt-4">
                        No orders yet
                      </Text>
                      <Text className="text-sm text-neutral-400 mt-2">
                        Your order history will appear here
                      </Text>
                    </View>
                  }
                />
              ) : (
                <View className="items-center justify-center py-10">
                  <Ionicons name="bag-outline" size={48} color="#ccc" />
                  <Text className="text-base text-neutral-500 mt-4">
                    No orders yet
                  </Text>
                  <Text className="text-sm text-neutral-400 mt-2">
                    Start shopping to see your orders here
                  </Text>
                  <TouchableOpacity
                    className="mt-4 px-6 py-3 bg-pink-500 rounded-full"
                    onPress={() => {
                      setOrdersModalVisible(false);
                      router.push('/(customer)/home');
                    }}
                  >
                    <Text className="text-white font-bold">Start Shopping</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                className="mt-5 py-3 bg-pink-500 items-center rounded-lg"
                onPress={() => setOrdersModalVisible(false)}
                disabled={isProcessing}
              >
                <Text className="text-white font-bold text-base">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Order Details Modal */}
        <Modal
          visible={orderDetailsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setOrderDetailsModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-5">
            <View className="w-full max-w-md bg-white p-5 max-h-[90%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-neutral-900">
                  Order Details
                </Text>
                <TouchableOpacity
                  onPress={() => setOrderDetailsModalVisible(false)}
                  className="p-1"
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedOrder && (
                <ScrollView className="flex-1">
                  {/* Order Header */}
                  <View className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-bold text-lg text-neutral-900">
                        Order #{selectedOrder.orderId}
                      </Text>
                      <View className="px-3 py-1 rounded-full" style={{ backgroundColor: getStatusColor(selectedOrder.status) + '20' }}>
                        <Text className="text-sm font-semibold" style={{ color: getStatusColor(selectedOrder.status) }}>
                          {selectedOrder.status}
                        </Text>
                      </View>
                    </View>
                    
                    <Text className="text-neutral-600 mb-1">
                      Ordered on {formatDate(selectedOrder.orderDate)} at {formatTime(selectedOrder.orderDate)}
                    </Text>
                    
                    <View className="mt-3 pt-3 border-t border-gray-200">
                      <View className="flex-row justify-between">
                        <Text className="font-semibold text-neutral-700">Total Amount:</Text>
                        <Text className="font-bold text-lg text-neutral-900">₹{selectedOrder.totalAmount}</Text>
                      </View>
                      
                      {selectedOrder.couponDiscount > 0 && (
                        <View className="flex-row justify-between mt-1">
                          <Text className="text-neutral-600">Coupon Discount:</Text>
                          <Text className="text-green-600 font-semibold">- ₹{selectedOrder.couponDiscount}</Text>
                        </View>
                      )}
                      
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-neutral-600">Payment Method:</Text>
                        <Text className="font-semibold text-neutral-700 capitalize">
                          {selectedOrder.paymentMethod}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Items List */}
                  <Text className="font-bold text-neutral-900 mb-3">Items Ordered</Text>
                  {selectedOrder.items.map((item: any, index: number) => (
                    <View key={index} className="flex-row items-center mb-3 p-3 border border-gray-100 rounded-lg">
                      <Image
                        source={{ uri: item.image }}
                        className="w-16 h-16 rounded-lg bg-gray-100 mr-3"
                      />
                      <View className="flex-1">
                        <Text className="font-semibold text-neutral-800 mb-1" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-sm text-neutral-600 mb-1">
                          Quantity: {item.quantity}
                        </Text>
                        <Text className="font-semibold text-neutral-900">
                          ₹{item.price * item.quantity}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Delivery Address */}
                  <Text className="font-bold text-neutral-900 mb-3 mt-6">Delivery Address</Text>
                  <View className="p-4 bg-gray-50 rounded-lg mb-3">
                    {selectedOrder.address ? (
                      <>
                        <Text className="font-semibold text-neutral-800 mb-2">
                          {selectedOrder.address.title} Address
                        </Text>
                        <Text className="text-neutral-600 mb-1">
                          {selectedOrder.address.house}, {selectedOrder.address.street}
                        </Text>
                        {selectedOrder.address.landmark && (
                          <Text className="text-neutral-600 mb-1">
                            Landmark: {selectedOrder.address.landmark}
                          </Text>
                        )}
                        <Text className="text-neutral-600 mb-1">
                          {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}
                        </Text>
                        {selectedOrder.address.name && (
                          <Text className="text-neutral-600 mb-1">
                            Receiver: {selectedOrder.address.name}
                          </Text>
                        )}
                        {selectedOrder.address.phone && (
                          <Text className="text-neutral-600">
                            Phone: {selectedOrder.address.phone}
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text className="text-neutral-500">Address not available</Text>
                    )}
                  </View>

                  {/* Delivery Instructions */}
                  {selectedOrder.deliveryInstructions && selectedOrder.deliveryInstructions.length > 0 && (
                    <>
                      <Text className="font-bold text-neutral-900 mb-3">Delivery Instructions</Text>
                      <View className="p-4 bg-gray-50 rounded-lg mb-3">
                        {selectedOrder.deliveryInstructions.map((instruction: string, index: number) => (
                          <View key={index} className="flex-row items-center mb-2">
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            <Text className="ml-2 text-neutral-600">{instruction}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                </ScrollView>
              )}

              <TouchableOpacity
                className="mt-5 py-3 bg-pink-500 items-center rounded-lg"
                onPress={() => setOrderDetailsModalVisible(false)}
              >
                <Text className="text-white font-bold text-base">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Addresses Modal (keep existing code) */}
        <Modal
          visible={addressesModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAddressesModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-5">
            <View className="w-full max-w-md bg-white p-5 max-h-[80%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-neutral-900">
                  Saved Addresses
                </Text>
                <TouchableOpacity
                  onPress={() => setAddressesModalVisible(false)}
                  className="p-1"
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {loadingAddresses ? (
                <View className="items-center justify-center py-10">
                  <ActivityIndicator size="large" color="#e6005c" />
                  <Text className="text-sm text-neutral-500 mt-3">
                    Loading address...
                  </Text>
                </View>
              ) : savedAddresses.length > 0 ? (
                <FlatList
                  data={savedAddresses}
                  keyExtractor={(item: any, index) =>
                    item.id ? item.id.toString() : index.toString()
                  }
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 8 }}
                  renderItem={({ item }: any) => {
                    const { fullAddress, cityStatePincode } = formatAddress(item);
                    return (
                      <View className="bg-pink-50 border border-pink-100 p-4 mb-3">
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center bg-pink-100 px-3 py-1">
                            <Ionicons
                              name={
                                item.title === 'Work'
                                  ? 'briefcase'
                                  : item.title === 'Gym'
                                  ? 'barbell'
                                  : 'home'
                              }
                              size={16}
                              color="#e6005c"
                            />
                            <Text className="text-xs font-bold text-pink-700 ml-2">
                              {item.title || 'Address'}
                            </Text>
                          </View>
                        </View>

                        <Text className="text-sm text-neutral-800 mb-1">
                          {fullAddress}
                        </Text>

                        {item.landmark ? (
                          <Text className="text-sm text-neutral-800 mb-1">
                            <Text className="font-semibold text-neutral-600">
                              Landmark:
                            </Text>{' '}
                            {item.landmark}
                          </Text>
                        ) : null}

                        <Text className="text-sm text-neutral-800 mb-1">
                          {cityStatePincode}
                        </Text>

                        {item.name ? (
                          <Text className="text-sm text-neutral-800 mb-1">
                            <Text className="font-semibold text-neutral-600">
                              Receiver:
                            </Text>{' '}
                            {item.name}
                          </Text>
                        ) : null}

                        {item.phone ? (
                          <Text className="text-sm text-neutral-800 mb-1">
                            <Text className="font-semibold text-neutral-600">
                              Phone:
                            </Text>{' '}
                            {item.phone}
                          </Text>
                        ) : null}

                        <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-100">
                          <TouchableOpacity
                            className="flex-row items-center px-3 py-1 border border-pink-600 ml-2"
                            onPress={() => openEditAddressModal(item)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator size="small" color="#e6005c" />
                            ) : (
                              <>
                                <Ionicons
                                  name="create-outline"
                                  size={16}
                                  color="#e6005c"
                                />
                                <Text className="text-xs font-semibold text-pink-700 ml-1">
                                  Edit
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-row items-center px-3 py-1 border border-red-300 ml-2"
                            onPress={() => handleDeleteAddress(item)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator size="small" color="#dc2626" />
                            ) : (
                              <>
                                <Ionicons
                                  name="trash-outline"
                                  size={16}
                                  color="#dc2626"
                                />
                                <Text className="text-xs font-semibold text-red-600 ml-1">
                                  Delete
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    <View className="items-center justify-center py-10">
                      <Ionicons name="location-outline" size={48} color="#ccc" />
                      <Text className="text-base text-neutral-500 mt-4">
                        No saved addresses
                      </Text>
                      <Text className="text-sm text-neutral-400 mt-2">
                        Add addresses from the cart screen
                      </Text>
                    </View>
                  }
                />
              ) : (
                <View className="items-center justify-center py-10">
                  <Ionicons name="location-outline" size={48} color="#ccc" />
                  <Text className="text-base text-neutral-500 mt-4">
                    No saved addresses found
                  </Text>
                  <Text className="text-sm text-neutral-400 mt-2">
                    Add addresses from the cart screen
                  </Text>
                </View>
              )}

              <TouchableOpacity
                className="mt-5 py-3 bg-pink-500 items-center"
                onPress={() => setAddressesModalVisible(false)}
                disabled={isProcessing}
              >
                <Text className="text-white font-bold text-base">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit Address Modal (keep existing code) */}
        <Modal
          visible={editAddressModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            if (!isProcessing) {
              setEditAddressModalVisible(false);
              resetEditAddressForm();
            }
          }}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-5">
            <View className="w-full max-w-md bg-white p-5 max-h-[90%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-neutral-900">
                  Edit Address
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!isProcessing) {
                      setEditAddressModalVisible(false);
                      resetEditAddressForm();
                    }
                  }}
                  className="p-1"
                  disabled={isProcessing}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1">
                <View className="my-4">
                  <Text className="text-base font-semibold text-black mb-3">
                    Save Address as
                  </Text>
                  <View className="flex-row flex-wrap">
                    {['Home', 'Work', 'Gym', 'Others'].map((type, index) => {
                      const selected = addressType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          className={`flex-row items-center justify-center px-3 py-2 border mb-2 ${
                            selected ? 'bg-pink-100 border-pink-600' : 'border-gray-300'
                          } ${index > 0 ? 'ml-2' : ''}`}
                          onPress={() =>
                            setAddressType(type as 'Home' | 'Work' | 'Gym' | 'Others')
                          }
                          disabled={isProcessing}
                        >
                          <Ionicons
                            name={
                              type === 'Home'
                                ? 'home'
                                : type === 'Work'
                                ? 'briefcase'
                                : type === 'Gym'
                                ? 'barbell'
                                : 'location'
                            }
                            size={18}
                            color={selected ? '#e6005c' : '#666'}
                          />
                          <Text
                            className={`ml-1 text-sm ${
                              selected ? 'text-pink-700 font-semibold' : 'text-gray-600'
                            }`}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View className="border-t border-dashed border-gray-300 my-2" />

                <View className="my-4">
                  <TextInput
                    className="bg-gray-100 border border-gray-300 px-3 py-3 text-sm mb-3"
                    placeholder="House No. / Floor *"
                    value={flatNo}
                    onChangeText={setFlatNo}
                    editable={!isProcessing}
                  />
                  <TextInput
                    className="bg-gray-100 border border-gray-300 px-3 py-3 text-sm mb-3"
                    placeholder="Street / Building name *"
                    value={buildingName}
                    onChangeText={setBuildingName}
                    editable={!isProcessing}
                  />
                  <TextInput
                    className="bg-gray-100 border border-gray-300 px-3 py-3 text-sm mb-3"
                    placeholder="Landmark"
                    value={landmark}
                    onChangeText={setLandmark}
                    editable={!isProcessing}
                  />
                  <View className="flex-row mb-3">
                    <TextInput
                      className="flex-1 bg-gray-100 border border-gray-300 px-3 py-3 text-sm mr-2"
                      placeholder="City *"
                      value={city}
                      onChangeText={setCity}
                      editable={!isProcessing}
                    />
                    <TextInput
                      className="flex-1 bg-gray-100 border border-gray-300 px-3 py-3 text-sm ml-2"
                      placeholder="State *"
                      value={stateName}
                      onChangeText={setStateName}
                      editable={!isProcessing}
                    />
                  </View>
                  <TextInput
                    className="bg-gray-100 border border-gray-300 px-3 py-3 text-sm mb-3"
                    placeholder="Pincode *"
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="number-pad"
                    editable={!isProcessing}
                  />
                </View>

                <View className="my-4">
                  <Text className="text-sm font-medium text-neutral-800 mb-1">
                    Receiver Name
                  </Text>
                  <TextInput
                    className="bg-gray-100 border border-gray-300 px-3 py-3 text-sm mb-3"
                    placeholder="Name..."
                    value={receiverName}
                    onChangeText={setReceiverName}
                    editable={!isProcessing}
                  />
                  <Text className="text-sm font-medium text-neutral-800 mb-1">
                    Receiver Phone Number
                  </Text>
                  <TextInput
                    className="bg-gray-100 border border-gray-300 px-3 py-3 text-sm mb-3"
                    placeholder="Phone number..."
                    value={receiverNumber}
                    onChangeText={setReceiverNumber}
                    keyboardType="phone-pad"
                    editable={!isProcessing}
                  />
                </View>

                <View className="flex-row justify-between mt-5 mb-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 py-4 mx-1 items-center"
                    onPress={() => {
                      if (!isProcessing) {
                        setEditAddressModalVisible(false);
                        resetEditAddressForm();
                      }
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#374151" />
                    ) : (
                      <Text className="text-base font-semibold text-gray-700">
                        Cancel
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-pink-600 py-4 mx-1 items-center"
                    onPress={handleSaveAddress}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-base font-semibold text-white">
                        Update Address
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function ProfileRow({
  icon,
  label,
  onPress,
  isLast,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between py-3 border-b border-pink-100 ${
        isLast ? 'border-b-0' : ''
      }`}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="flex-row items-center">
        <View className="w-9 h-9 rounded-full bg-pink-50 items-center justify-center mr-3">
          <Ionicons name={icon} size={18} color="#f90e7bff" />
        </View>
        <Text className="text-base text-neutral-800">{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#f90e7bff" />
    </TouchableOpacity>
  );
}