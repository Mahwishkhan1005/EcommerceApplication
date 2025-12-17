import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { adressApi } from '../(utils)/axiosInstance';

// API Configuration
const AUTH_TOKEN_KEY = '@auth_token';
const STORAGE_ADDRESS = '@saved_user_address';

const carddata = [
  { id: 1, Title: 'Beware of pet' },
  { id: 2, Title: "Don't ring the bell" },
  { id: 3, Title: "Don't contact" },
];

const mockCartItems = [
  {
    id: 1,
    name: 'Milky Mist Paneer',
    pack: '1 pack (200 g)',
    price: 108,
    originalPrice: 130,
    quantity: 1,
    image:
      'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSC7ZcmsJ6pQm11OxrtMxQSWyy_uPWfwhJi3J7dUIXXjp_Obv2V8yo5AeW8pz45pYqiUjPPNz3WCv4IhzVQT5sI7jQmApUKVg',
  },
];

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState(mockCartItems);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressType, setAddressType] = useState('Home');
  const [flatNo, setFlatNo] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverNumber, setReceiverNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [availableCoupons] = useState([
    {
      code: 'TRYBHIM',
      title: 'Get ₹20 - ₹40 Savings with BHIM App',
      minOrder: 99,
      type: 'fixed_range',
      minSavings: 20,
      maxSavings: 40,
      note: 'Offer applicable on total payable amount above ₹99. (exclusive of any Zepto cash applied)',
    },
    {
      code: 'RENEE5%OFF',
      title: 'Extra 5% off on RENEE products',
      minOrder: 399,
      type: 'percent',
      percent: 5,
      note: 'Add products worth ₹399 to qualify for this deal.',
    },
  ]);

  const [loadingApi, setLoadingApi] = useState(false);
  const [addressesList, setAddressesList] = useState([]);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllOtherAddresses, setShowAllOtherAddresses] = useState(true);
  useEffect(() => {
    loadSavedAddress();
    fetchAddressesFromApi();
  }, []);

  const loadSavedAddress = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_ADDRESS);
      console.log('Raw saved address from storage:', raw);
      
      if (raw) {
        const saved = JSON.parse(raw);
        console.log('Parsed saved address:', saved);
        setSelectedAddress(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved address:', e);
    }
  };

  // ---------------- API: GET all addresses ----------------
  const fetchAddressesFromApi = async () => {
    setLoadingApi(true);
    try {
      console.log('Fetching addresses from API...');
      const res = await adressApi.get('/address/all');
      
      console.log('Fetch addresses full response:', JSON.stringify(res, null, 2));
      console.log('Response data:', res.data);
      
      if (res.data && Array.isArray(res.data)) {
        const formattedAddresses = res.data.map(addr => ({
          id: addr.id || addr._id || addr.addressId,
          title: addr.title || addr.addressType || 'Home',
          house: addr.house || addr.houseNo || addr.flatNo || '',
          street: addr.street || addr.buildingName || '',
          landmark: addr.landmark || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.pincode || addr.pinCode || '',
          name: addr.name || addr.receiverName || '',
          phone: addr.phone || addr.receiverNumber || ''
        }));
        
        console.log('Formatted addresses:', formattedAddresses);
        setAddressesList(formattedAddresses);
        const savedAddress = await AsyncStorage.getItem(STORAGE_ADDRESS);
        let savedParsed = null;
        if (savedAddress) {
          savedParsed = JSON.parse(savedAddress);
        }
        if (formattedAddresses.length > 0 && !selectedAddress) {
          const primary = formattedAddresses[0];
          setSelectedAddress(primary);
          await AsyncStorage.setItem(STORAGE_ADDRESS, JSON.stringify(primary));
          console.log('Set first address as selected:', primary);
        }
        if (savedParsed && savedParsed.id && formattedAddresses.length > 0) {
          const found = formattedAddresses.find(addr => addr.id === savedParsed.id);
          if (found) {
            setSelectedAddress(found);
          } else if (formattedAddresses.length > 0) {
            setSelectedAddress(formattedAddresses[0]);
            await AsyncStorage.setItem(STORAGE_ADDRESS, JSON.stringify(formattedAddresses[0]));
          }
        }
      } else {
        console.warn('Invalid response format or empty array:', res.data);
        setAddressesList([]);
      }
      
    } catch (e) {
      console.error('Error fetching addresses:', e.message || e);
      console.error('Full error:', e);
      Alert.alert('Error', 'Failed to load addresses. Please try again.');
    } finally {
      setLoadingApi(false);
    }
  };

  // ---------------- API: Save/Update address ----------------
  const saveAddressToApi = async (addressData) => {
    try {
      setIsProcessing(true);
      let res;
      
      console.log('Saving address with data:', addressData);
      console.log('Editing address ID:', editingAddressId);
      
      if (editingAddressId) {
        res = await adressApi.put(
          `/address/update/${editingAddressId}`,
          addressData
        );
      } else {
        res = await adressApi.post('/address/add', addressData);
      }

      console.log('Save address response:', JSON.stringify(res, null, 2));
      if (res.data) {
        console.log('Saved address data:', res.data);
        const formattedResponse = {
          id: res.data.id || res.data._id || res.data.addressId || editingAddressId,
          title: res.data.title || addressData.title,
          house: res.data.house || addressData.house,
          street: res.data.street || addressData.street,
          landmark: res.data.landmark || addressData.landmark,
          city: res.data.city || addressData.city,
          state: res.data.state || addressData.state,
          pincode: res.data.pincode || addressData.pincode,
          name: res.data.name || addressData.name,
          phone: res.data.phone || addressData.phone
        };
        return formattedResponse;
      } else {
        throw new Error('No data in response');
      }

    } catch (e) {
      console.error('Save address error:', e.response?.data || e.message || e);
      throw new Error(e.response?.data?.message || e.message || 'Failed to save address');
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------- API: DELETE address ----------------
  const deleteAddressFromApi = async (id) => {
    try {
      setIsProcessing(true);
      console.log('Deleting address ID:', id);
      
      const response = await adressApi.delete(`/address/delete/${id}`,id);

      console.log('Delete response:', JSON.stringify(response, null, 2));
      
      if (response.status === 200 || response.status === 204) {
        return true;
      } else {
        throw new Error(`Delete failed with status: ${response.status}`);
      }

    } catch (e) {
      console.error('Delete API error:', e.response?.data || e.message || e);
      throw new Error(e.response?.data?.message || e.message || 'Failed to delete address');
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------- Address Management Functions ----------------
  const handleSaveAddress = async () => {
    if (!flatNo || !buildingName || !city || !state || !pincode) {
      return Alert.alert('Validation', 'Please fill all required fields');
    }

    const payload = {
      title: addressType,
      house: flatNo,
      street: buildingName,
      landmark: landmark || '',
      city,
      state,
      pincode,
      name: receiverName || '',
      phone: receiverNumber || '',
    };

    console.log('Saving address payload:', payload);

    try {
      const saved = await saveAddressToApi(payload);
      
      console.log('Saved address from API:', saved);
      setSelectedAddress(saved);
      await AsyncStorage.setItem(STORAGE_ADDRESS, JSON.stringify(saved));
      await fetchAddressesFromApi();
      resetAddressForm();
      setShowAddressModal(false);
      
      Alert.alert('Success', 'Address saved successfully');

    } catch (e) {
      console.error('Handle save address error:', e);
      Alert.alert('Error', e.message || 'Failed to save address');
    }
  };
// handle delete
  const selectAddress = async (address) => {
    console.log('Selecting address:', address);
    setSelectedAddress(address);
    await AsyncStorage.setItem(STORAGE_ADDRESS, JSON.stringify(address));
  };

  const openAddAddressModal = () => {
    console.log('Opening add address modal');
    resetAddressForm();
    setEditingAddressId(null);
    setShowAddressModal(true);
  };

  const openEditAddressModal = (address) => {
    if (address) {
      console.log('Opening edit address modal for:', address);
      setAddressType(address.title || 'Home');
      setFlatNo(address.house || '');
      setBuildingName(address.street || '');
      setLandmark(address.landmark || '');
      setReceiverName(address.name || '');
      setReceiverNumber(address.phone || '');
      setCity(address.city || '');
      setState(address.state || '');
      setPincode(address.pincode || '');
      setEditingAddressId(address.id);
      setShowAddressModal(true);
    }
  };

  const resetAddressForm = () => {
    setAddressType('Home');
    setFlatNo('');
    setBuildingName('');
    setLandmark('');
    setReceiverName('');
    setReceiverNumber('');
    setCity('');
    setState('');
    setPincode('');
    setEditingAddressId(null);
  };

  // ---------------- Cart Functions ----------------
  const toggleCardSelection = (id) => {
    setSelectedCards(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderCard = ({ item }) => {
    const isSelected = selectedCards.includes(item.id);

    let iconName = 'information-circle-outline';

    if (item.Title === 'Beware of pet') {
      iconName = 'paw-outline';
    } 
    else if (item.Title === "Don't ring the bell") {
      iconName = 'notifications-off-outline';
    } 
    else if (item.Title === "Don't contact") {
      iconName = 'hand-left-outline';
    }

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => toggleCardSelection(item.id)}
        className={`bg-white mx-2 w-48 h-32 justify-center items-center shadow-sm border ${
          isSelected ? 'border-[#e6005c] bg-[#fff0f4]' : 'border-gray-200'
        } px-3`}
      >
        {/* ICON */}
        <Ionicons
          name={iconName}
          size={30}
          color={isSelected ? '#e6005c' : '#555'}
          style={{ marginBottom: 8 }}
        />

        {/* TEXT */}
        <Text
          className={`text-base font-bold text-center ${
            isSelected ? 'text-[#e6005c]' : 'text-black'
          }`}
        >
          {item.Title}
        </Text>
      </TouchableOpacity>
    );
  };

  const HorizontalcardList = () => {
    return (
      <FlatList
        data={carddata}
        renderItem={renderCard}
        keyExtractor={(item) => String(item.id)}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      />
    );
  };

  const updateQuantity = (id, change) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const itemTotal = cartItems.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0
  );
  const discountedTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const handlingFee = 10;
  const deliveryFee = 30;
  const totalToPay = discountedTotal;

  // ---------------- Coupon Functions ----------------
  const applyCouponObj = (coupon) => {
    if (!coupon) return Alert.alert('Error', 'Invalid coupon');
    if (coupon.minOrder && totalToPay < coupon.minOrder) {
      return Alert.alert('Minimum Order Required', `Offer applicable on total payable amount above ₹${coupon.minOrder}.`);
    }

    let discount = 0;
    if (coupon.type === 'fixed_range') {
      discount = coupon.minSavings || 0;
    } else if (coupon.type === 'percent') {
      discount = Math.floor((totalToPay * (coupon.percent || 0)) / 100);
    }

    setAppliedCoupon(coupon);
    setAppliedDiscount(discount);
    setShowCouponsModal(false);
    Alert.alert('Coupon Applied', `Coupon ${coupon.code} applied. You saved ₹${discount}.`);
  };

  const applyCouponByCode = () => {
    const code = (couponCode || '').trim().toUpperCase();
    if (!code) return Alert.alert('Error', 'Enter coupon code');
    const found = availableCoupons.find(c => c.code.toUpperCase() === code);
    if (!found) return Alert.alert('Error', 'Invalid coupon code');
    applyCouponObj(found);
  };

  const finalPayable = Math.max(0, totalToPay - appliedDiscount);

  // ---------------- Render Other Addresses ----------------
  const renderOtherAddresses = () => {
    const otherAddresses = addressesList.filter(addr => 
      !selectedAddress || addr.id !== selectedAddress.id
    );
    
    if (otherAddresses.length === 0) return null;

    return (
      <View className="mb-3">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-semibold text-gray-800">Other Addresses</Text>
          <TouchableOpacity onPress={() => setShowAllOtherAddresses(!showAllOtherAddresses)}>
            <Ionicons 
              name={showAllOtherAddresses ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
        
        {showAllOtherAddresses && otherAddresses.map((address) => (
          <TouchableOpacity
            key={address.id}
            className="bg-gray-50 p-3 mb-2 border border-gray-200"
            onPress={() => selectAddress(address)}
          >
            <View className="flex-1">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-sm text-[#e6005c] font-semibold">{address.title || 'Address'}</Text>
                <TouchableOpacity
                  className="p-1"
                  onPress={() => openEditAddressModal(address)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  disabled={isProcessing}
                >
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-800 leading-5 mb-1">
                {address.house || ''}, {address.street || ''}, {address.city || ''}
              </Text>
              {address.landmark ? (
                <Text className="text-xs text-gray-600 italic">Landmark: {address.landmark}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  useEffect(() => {
    console.log('Selected Address Updated:', selectedAddress);
  }, [selectedAddress]);

  useEffect(() => {
    console.log('Addresses List Updated:', addressesList);
  }, [addressesList]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 pt-3 pb-3 border-b border-gray-200 bg-white">
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-24"
      >
        <View className="px-4 mb-3 mt-2">
          {cartItems.map(item => (
            <View key={item.id} className="flex-row mb-4 items-center border-b border-gray-100 pb-3">
              <Image source={{ uri: item.image }} className="w-16 h-16 rounded bg-gray-100" />
              <View className="flex-1 ml-3">
                <Text className="text-base font-bold text-black mb-1">{item.name}</Text>
                <Text className="text-sm text-gray-600 mb-2">{item.pack}</Text>
                <View className="flex-row items-center bg-white rounded border border-[#f4d8d8] self-start py-1 px-1.5">
                  <TouchableOpacity
                    className="px-2 py-1"
                    onPress={() => updateQuantity(item.id, -1)}>
                    <Text className="text-lg text-[#e63a00] font-semibold">−</Text>
                  </TouchableOpacity>
                  <Text className="text-base font-semibold text-[#e65c00] mx-2">{item.quantity}</Text>
                  <TouchableOpacity
                    className="px-2 py-1"
                    onPress={() => updateQuantity(item.id, 1)}>
                    <Text className="text-lg text-[#e63a00] font-semibold">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="ml-2 items-end">
                <Text className="text-base font-bold text-black">₹{item.price * item.quantity}</Text>
                <Text className="text-sm text-gray-400 line-through mt-1">
                  ₹{item.originalPrice * item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ---- ADD MORE ITEMS ROW ---- */}
        <View className="flex-row items-center justify-between px-4 mb-3 mt-1.5">
          <Text className="text-base font-semibold text-gray-900">Add something?</Text>
          <TouchableOpacity
            className="flex-row items-center bg-[#e6005c] py-2.5 px-3.5 rounded"
            activeOpacity={0.9}
            onPress={() => {
              navigation.navigate('Products');
            }}
          >
            <Ionicons name="add" size={18} color="#fff" className="mr-2" />
            <Text className="text-white font-bold text-sm">Add More Items</Text>
          </TouchableOpacity>
        </View>

        {/* ---- COUPONS ROW ---- */}
        <TouchableOpacity 
          className="flex-row items-center bg-[#fff8f0] mx-4 rounded py-3 px-3.5 justify-between mb-3 border border-[#fff0e6]"
          onPress={() => setShowCouponsModal(true)}
        >
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded bg-[#e6ffef] items-center justify-center mr-3">
              <Ionicons name="pricetag" size={18} color="#00a86b" />
            </View>
            <Text className="font-bold text-gray-900">View Coupons & Offers</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        {/* ---- BILL SUMMARY ---- */}
        <View className="bg-gray-50 rounded mx-4 p-4 mb-5">
          <View className="flex-row items-center mb-3">
            <Ionicons name="document-text" size={20} color="#333" />
            <Text className="text-lg font-bold ml-2 text-black">Bill summary</Text>
          </View>
          <View className="flex-row justify-between items-center my-2">
            <Text className="text-sm text-gray-600">Item Total:</Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-400 line-through">₹{itemTotal}</Text>
              <Text className="text-sm font-semibold text-black ml-2">₹{discountedTotal}</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center my-2">
            <Text className="text-sm text-gray-600">Handling Fee:</Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-400 line-through">₹{handlingFee}</Text>
              <Text className="text-sm font-semibold text-[#00a86b] ml-2">FREE</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center my-2">
            <Text className="text-sm text-gray-600">Delivery Fee:</Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-400 line-through">₹{deliveryFee}</Text>
              <Text className="text-sm font-semibold text-[#00a86b] ml-2">FREE</Text>
            </View>
          </View>

          <View className="h-px bg-gray-300 my-3" />

          {appliedCoupon && (
            <>
              <View className="flex-row justify-between items-center my-2">
                <Text className="text-sm text-gray-600">Coupon ({appliedCoupon.code})</Text>
                <Text className="text-sm font-semibold text-[#00a86b]">- ₹{appliedDiscount}</Text>
              </View>
              <View className="h-px bg-gray-300 my-3" />
            </>
          )}

          <View className="flex-row justify-between items-center my-2">
            <Text className="text-base font-bold text-black">To Pay:</Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-400 line-through">₹{itemTotal + handlingFee + deliveryFee}</Text>
              <Text className="text-base font-bold text-black ml-2">₹{finalPayable}</Text>
            </View>
          </View>
        </View>

        {/* ---- DELIVERY INSTRUCTION ---- */}
        <View className="mb-5">
          <View className="flex-row items-center mb-2 px-4">
            <Ionicons name="chatbox-ellipses-outline" size={20} color="#333" />
            <Text className="text-lg font-bold ml-2 text-black">Delivery Instruction</Text>
          </View>
          <Text className="text-gray-600 mb-2 text-xs px-4">Delivery partner will be notified</Text>
          <HorizontalcardList />
        </View>

        {/* ---- SAVED ADDRESS CARD ---- */}
        {selectedAddress ? (
          <View className="px-4 pb-5 bg-white mt-2">
            <View className="flex-row items-start bg-[#fff8fb] p-3 border border-[#ffe5f0] mb-3 shadow-sm">
              <View className="flex-1">
                <Text className="text-sm text-[#e6005c] font-bold mb-1">{selectedAddress.title || 'Address'} Address</Text>
                <Text className="text-sm text-gray-800 mb-1 leading-4">
                  {selectedAddress.house ? `${selectedAddress.house}, ` : ''}
                  {selectedAddress.street ? `${selectedAddress.street}` : ''}
                  {!selectedAddress.house && !selectedAddress.street ? 'No address details' : ''}
                </Text>
                {selectedAddress.landmark ? (
                  <Text className="text-sm text-gray-800 mb-1 leading-4">Landmark: {selectedAddress.landmark}</Text>
                ) : null}
                <Text className="text-sm text-gray-800 mb-1 leading-4">
                  {selectedAddress.city ? `${selectedAddress.city}, ` : ''}
                  {selectedAddress.state ? `${selectedAddress.state}` : ''}
                  {selectedAddress.pincode ? ` - ${selectedAddress.pincode}` : ''}
                </Text>
                <Text className="text-sm text-gray-800 mb-1 leading-4">Receiver: {selectedAddress.name || 'Not specified'}</Text>
                <Text className="text-sm text-gray-800 mb-1 leading-4">Phone: {selectedAddress.phone || 'Not specified'}</Text>
              </View>
              <View className="ml-3 items-end">
                <TouchableOpacity 
                  className="py-1.5 px-2.5 bg-white rounded border border-[#e6005c] mb-1.5 min-w-[60px] items-center justify-center h-8"
                  onPress={() => openEditAddressModal(selectedAddress)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#e6005c" />
                  ) : (
                    <Text className="text-[#e6005c] font-bold text-xs">Edit</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  className="py-1.5 px-2.5 bg-[#fef2f2] rounded border border-[#fca5a5] min-w-[60px] items-center justify-center h-8"
                  onPress={() => deleteAddressFromApi(selectedAddress.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#c02626" />
                  ) : (
                    <Text className="text-[#c02626] font-bold text-xs">Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Add New Address Button */}
            <TouchableOpacity 
              className="flex-row items-center justify-center bg-gray-50 p-3 border border-gray-200 mb-4"
              onPress={openAddAddressModal}
              disabled={isProcessing}
            >
              <Ionicons name="add-circle-outline" size={20} color="#e6005c" />
              <Text className="text-sm text-[#e6005c] font-semibold ml-2">Add New Address</Text>
            </TouchableOpacity>
            
            {/* Other Addresses List */}
            {renderOtherAddresses()}
          </View>
        ) : (
          <View className="px-4 py-5 items-center">
            <Text className="text-base text-gray-600 mb-3">No address selected</Text>
            <TouchableOpacity 
              className="flex-row items-center justify-center bg-gray-50 p-3 border border-gray-200 w-full"
              onPress={openAddAddressModal}
              disabled={isProcessing}
            >
              <Ionicons name="add-circle-outline" size={20} color="#e6005c" />
              <Text className="text-sm text-[#e6005c] font-semibold ml-2">Add Your First Address</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ---- LOADING INDICATOR ---- */}
      {(loadingApi || isProcessing) && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-white/80 justify-center items-center z-50">
          <ActivityIndicator size="small" color="#e6005c" />
          <Text className="ml-2 text-sm text-gray-600">
            {isProcessing ? 'Processing...' : 'Loading...'}
          </Text>
        </View>
      )}

      {/* ---- ACTION BUTTON ---- */}
      <View className="p-4 bg-white border-t border-gray-200 absolute bottom-0 left-0 right-0 shadow-lg">
        <TouchableOpacity
          className="bg-[#e6005c] rounded py-4 items-center justify-center shadow-md"
          onPress={() => {
            if (!selectedAddress) {
              openAddAddressModal();
            } else {
              Alert.alert(
                'Confirm Order',
                `Pay ₹${finalPayable} and deliver to:\n${selectedAddress.house || ''}, ${selectedAddress.street || ''}\n${selectedAddress.city || ''}, ${selectedAddress.state || ''} - ${selectedAddress.pincode || ''}`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Confirm', onPress: () => Alert.alert('Success', 'Order placed successfully!') }
                ]
              );
            }
          }}
          disabled={isProcessing}
        >
          <Text className="text-white text-base font-semibold">
            {isProcessing ? 'Processing...' : selectedAddress ? `Click to Pay ₹${finalPayable}` : 'Add Address to proceed'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ---- ADDRESS MODAL ---- */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!isProcessing) setShowAddressModal(false);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl max-h-[90%]">
            <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
              <Text className="text-xl font-bold text-black">
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isProcessing) setShowAddressModal(false);
                }}
                className="p-1"
                disabled={isProcessing}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              {/* Save Address As */}
              <View className="my-4">
                <Text className="text-base font-semibold text-black mb-3">Save Address as</Text>
                <View className="flex-row justify-between">
                  {['Home', 'Work', 'Others'].map((type, index) => (
                    <TouchableOpacity
                      key={type}
                      className={`flex-1 flex-row items-center justify-center py-3 px-2 rounded border ${
                        addressType === type 
                          ? 'bg-[#ffe5f0] border-[#e6005c]' 
                          : 'border-gray-300'
                      } ${index > 0 ? 'ml-3' : ''}`}
                      onPress={() => setAddressType(type)}
                      disabled={isProcessing}
                    >
                      <Ionicons
                        name={type === 'Home' ? 'home' : type === 'Work' ? 'briefcase' : 'location'}
                        size={20}
                        color={addressType === type ? '#e6005c' : '#666'}
                      />
                      <Text
                        className={`text-sm font-medium ml-1.5 ${
                          addressType === type ? 'text-[#e6005c] font-semibold' : 'text-gray-600'
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="border-t border-gray-300 border-dashed my-2" />

              {/* Address Fields */}
              <View className="my-4">
                <TextInput
                  className="bg-gray-100 rounded p-3 text-sm mb-3 border border-gray-300"
                  placeholder="House No. / Floor *"
                  value={flatNo}
                  onChangeText={setFlatNo}
                  editable={!isProcessing}
                />
                <TextInput
                  className="bg-gray-100 rounded p-3 text-sm mb-3 border border-gray-300"
                  placeholder="Street / Building name *"
                  value={buildingName}
                  onChangeText={setBuildingName}
                  editable={!isProcessing}
                />
                <TextInput
                  className="bg-gray-100 rounded p-3 text-sm mb-3 border border-gray-300"
                  placeholder="Landmark"
                  value={landmark}
                  onChangeText={setLandmark}
                  editable={!isProcessing}
                />
                <View className="flex-row mb-3">
                  <TextInput
                    className="flex-1 bg-gray-100 rounded p-3 text-sm border border-gray-300 mr-2"
                    placeholder="City *"
                    value={city}
                    onChangeText={setCity}
                    editable={!isProcessing}
                  />
                  <TextInput
                    className="flex-1 bg-gray-100 rounded p-3 text-sm border border-gray-300 ml-2"
                    placeholder="State *"
                    value={state}
                    onChangeText={setState}
                    editable={!isProcessing}
                  />
                </View>
                <TextInput
                  className="bg-gray-100 rounded p-3 text-sm mb-3 border border-gray-300"
                  placeholder="Pincode *"
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  editable={!isProcessing}
                />
              </View>

              {/* Receiver Details */}
              <View className="my-4">
                <Text className="text-sm font-medium text-gray-800 mb-1.5 mt-1">Receiver Name</Text>
                <TextInput
                  placeholder="Name..."
                  className="bg-gray-100 rounded p-3 text-sm mb-3 border border-gray-300"
                  value={receiverName}
                  onChangeText={setReceiverName}
                  editable={!isProcessing}
                />
                <Text className="text-sm font-medium text-gray-800 mb-1.5 mt-1">Receiver Phone Number</Text>
                <TextInput
                  placeholder="Phone number..."
                  className="bg-gray-100 rounded p-3 text-sm mb-3 border border-gray-300"
                  value={receiverNumber}
                  onChangeText={setReceiverNumber}
                  keyboardType="phone-pad"
                  editable={!isProcessing}
                />
              </View>

              <TouchableOpacity 
                className={`bg-[#e6005c] rounded py-4 items-center mt-5 mb-5 shadow-md ${
                  isProcessing ? 'bg-gray-400' : ''
                }`}
                onPress={handleSaveAddress}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    {editingAddressId ? 'Update Address' : 'Save Address'}
                  </Text>
                )}
              </TouchableOpacity>
              <View className="h-5" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---- COUPONS MODAL ---- */}
      <Modal
        visible={showCouponsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCouponsModal(false)}
      >
        <View className="flex-1 bg-black/35 justify-end">
          <View className="bg-white rounded-t-2xl max-h-[80%] py-3">
            <View className="flex-row justify-between px-3.5 items-center py-2.5 border-b border-gray-200">
              <Text className="text-lg font-extrabold">Apply Coupons</Text>
              <TouchableOpacity onPress={() => setShowCouponsModal(false)}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Enter coupon code row */}
            <View className="flex-row px-3 py-3 items-center">
              <TextInput
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChangeText={setCouponCode}
                className="flex-1 border border-gray-300 rounded p-3 mr-2.5 bg-gray-50"
                autoCapitalize="characters"
              />
              <TouchableOpacity className="px-3 py-2.5" onPress={applyCouponByCode}>
                <Text className="font-bold text-[#e6005c]">APPLY</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-base font-bold px-3.5 mb-2.5">Available Coupons</Text>

            <ScrollView className="px-3" showsVerticalScrollIndicator={false}>
              {availableCoupons.map((c) => (
                <View key={c.code} className="bg-white rounded border border-gray-200 p-3 mb-3">
                  <View className="flex-row justify-between items-center">
                    <View className="rounded border border-dashed border-gray-400 px-2 py-1.5 bg-gray-50">
                      <Text className="font-bold text-[#8b6fb3]">{c.code}</Text>
                    </View>
                    <TouchableOpacity onPress={() => applyCouponObj(c)}>
                      <Text className="text-[#e6005c] font-bold">APPLY</Text>
                    </TouchableOpacity>
                  </View>

                  <Text className="font-semibold text-gray-900 mt-2">{c.title}</Text>
                  <Text className="text-[#e55b83] mt-2">{c.note}</Text>
                  <Text className="text-gray-600 font-bold mt-2">+MORE</Text>
                </View>
              ))}
              <View className="h-9" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default CartScreen;