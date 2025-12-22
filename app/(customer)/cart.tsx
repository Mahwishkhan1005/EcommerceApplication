import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { memo, useCallback, useEffect, useState } from 'react';
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
import { adressApi, cartApi, payApi } from '../(utils)/axiosInstance';

const STORAGE_ADDRESS = '@saved_user_address';
const ORDER_HISTORY_KEY = '@order_history';


const carddata = [
  { id: 1, Title: 'Beware of pet' },
  { id: 2, Title: "Don't ring the bell" },
  { id: 3, Title: "Don't contact" },
];

const CartScreen = () => {
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

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartData, setCartData] = useState<any>(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  const [addressType, setAddressType] = useState('Home');
  const [flatNo, setFlatNo] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverNumber, setReceiverNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  

  const [loadingApi, setLoadingApi] = useState(false);
  const [addressesList, setAddressesList] = useState<any[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllOtherAddresses, setShowAllOtherAddresses] = useState(true);

  const [recentlyAddedProduct, setRecentlyAddedProduct] = useState<any>(null);

  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<'cod' | 'card'>('cod');
  const [showSuccessModal, setShowSuccessModal] = useState(false);  
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // ------------- CART APIs -------------

  const fetchCartItems = async () => {
    try {
      setLoadingApi(true);
      const res = await cartApi.get('api/cart/byId');

      const items =
        res.data?.items?.map((item: any) => ({
          id: item.id,
          productId: item.pid,
          name: item.pname,
          pack: '',
          price: item.actualPrice,
          originalPrice: item.price,
          quantity: item.quantity,
          image: item.imagePath,
        })) || [];

      setCartItems(items);
      setCartData(res.data);

      if (res.data?.appliedCoupon) {
        setAppliedCoupon(res.data.appliedCoupon);
        setAppliedDiscount(res.data.discountAmount || 0);
        setShowCouponsModal(false);
      } else {
        setAppliedCoupon(null);
        setAppliedDiscount(0);
      }
    } catch (e: any) {
      console.log('fetchCartItems error:', e.response?.data || e.message);
      Alert.alert('Error', 'Failed to load cart');
    } finally {
      setLoadingApi(false);
    }
  };

  const addItemToCart = async (products: any, quantity = 1) => {
    try {
      setIsProcessing(true);
      await cartApi.post('api/cart/add', { pid: products.id, quantity });
      await fetchCartItems();
      Alert.alert('Success', 'Item added to cart');
    } catch (e: any) {
      console.log('addItemToCart error:', e.response?.data || e.message || e);
      Alert.alert('Error', 'Failed to add to cart');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateCartItemQuantity = async (itemId: any, newQty: number) => {
    const prev = cartItems;
    setCartItems(items =>
      items.map(it => (it.id === itemId ? { ...it, quantity: newQty } : it)),
    );
    try {
      await cartApi.put(
        `api/cart/item/${itemId}/quantity`,
        {},
        { params: { quantity: newQty } },
      );
    } catch (e: any) {
      console.log('updateCartItemQuantity error:', e.response?.data || e.message || e);
      setCartItems(prev);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const deleteCartItem = async (itemId: any) => {
    const prev = cartItems;
    setCartItems(items => items.filter(it => it.id !== itemId));
    try {
      await cartApi.delete(`api/cart/item/${itemId}`);
    } catch (e: any) {
      console.log('deleteCartItem error:', e.response?.data || e.message || e);
      setCartItems(prev);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const clearCart = async () => {
    const prevItems = cartItems;
    const prevData = cartData;
    setCartItems([]);
    setCartData(null);
    setRecentlyAddedProduct(null);
    try {
      await cartApi.delete('api/cart/clear');
      await AsyncStorage.removeItem('recentlyAddedProduct');
    } catch (e: any) {
      console.log('clearCart error:', e.response?.data || e.message || e);
      setCartItems(prevItems);
      setCartData(prevData);
      Alert.alert('Error', 'Failed to clear cart');
    }
  };

  // ------------- COUPON APIs -------------

  const fetchAvailableCoupon = useCallback(async () => {
    try {
      setCouponsLoading(true);
      const res = await cartApi.get('api/cart/coupons/all');
      
      // Format coupon data properly
      const formattedCoupons = (res.data || []).map((coupon: any) => ({
        id: coupon.id || coupon._id,
        code: coupon.code || '',
        description: coupon.description || getCouponDescription(coupon),
        type: coupon.type || 'fixed',
        discountValue: coupon.discountValue || coupon.discount || coupon.minSavings || 0,
        percent: coupon.percent || coupon.discountPercent || 0,
        maxDiscount: coupon.maxDiscount || coupon.maxSavings || 0,
        minOrder: coupon.minOrder || coupon.minimumOrder || 0,
        title: coupon.title || coupon.name || '',
      }));
      
      setAvailableCoupons(formattedCoupons);
    } catch (e: any) {
      console.log('fetchAvailableCoupons error', e.response?.data || e.message);
      Alert.alert('Error', 'Failed to load coupons');
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  //saved order 
  const saveOrderToHistory = async (order: any) => {
  try {
    const raw = await AsyncStorage.getItem(ORDER_HISTORY_KEY);
    const existingOrders = raw ? JSON.parse(raw) : [];
    const updatedOrders = [order, ...existingOrders];
    await AsyncStorage.setItem(
      ORDER_HISTORY_KEY,
      JSON.stringify(updatedOrders)
    );
  } catch (e) {
    console.log('Order history save failed', e);
  }
};


  // Helper function to get coupon description
  const getCouponDescription = (coupon: any) => {
    if (coupon.description) return coupon.description;
    
    const type = coupon.type || 'fixed';
    const discountValue = coupon.discountValue || coupon.discount || coupon.minSavings || 0;
    const percent = coupon.percent || coupon.discountPercent || 0;
    const maxDiscount = coupon.maxDiscount || coupon.maxSavings || 0;
    const minOrder = coupon.minOrder || coupon.minimumOrder || 0;
    
    if (type === 'percent') {
      if (maxDiscount > 0) {
        return `${percent}% off up to ₹${maxDiscount}`;
      }
      return `${percent}% off`;
    } else if (type === 'fixed_range' || type === 'fixed') {
      if (minOrder > 0) {
        return `Get ₹${discountValue} off on orders above ₹${minOrder}`;
      }
      return `Get ₹${discountValue} off`;
    }
    
    return 'Discount coupon';
  };

  // Helper function to get coupon display title
  const getCouponDisplayTitle = (coupon: any) => {
    const type = coupon.type || 'fixed';
    const discountValue = coupon.discountValue || coupon.discount || coupon.minSavings || 0;
    const percent = coupon.percent || coupon.discountPercent || 0;
    const maxDiscount = coupon.maxDiscount || coupon.maxSavings || 0;
    
    if (type === 'percent') {
      if (maxDiscount > 0) {
        return `${percent}% off`;
      }
      return `${percent}% off`;
    } else if (type === 'fixed_range' || type === 'fixed') {
      return `₹${discountValue} off`;
    }
    
    return 'Discount';
  };

  const applyCoupon = useCallback(
    async (code: string) => {
      try {
        setIsProcessing(true);
        setCouponError(null);

        const res = await cartApi.post(`api/cart/apply-coupon/${code}`);

        if (res.data) {
          setCartData(res.data);

          const items =
            res.data?.items?.map((item: any) => ({
              id: item.id,
              productId: item.pid,
              name: item.pname,
              pack: '',
              price: item.price,
              originalPrice: item.actualPrice,
              quantity: item.quantity,
              image: item.imagePath,
            })) || [];
          setCartItems(items);

          if (res.data.appliedCoupon) {
            setAppliedCoupon(res.data.appliedCoupon);
            setAppliedDiscount(res.data.discountAmount || 0);
            setCouponCode(res.data.appliedCoupon?.code || '');
            Alert.alert(
              'Success',
              `Coupon ${code} applied successfully. Discount: ₹${
                res.data.discountAmount || 0
              }`,
            );
          }
        }
      } catch (e: any) {
        console.log('applycoupon error', e.response?.data || e.message);
        const errorMsg = e.response?.data?.message || 'Failed to apply coupon';
        setCouponError(errorMsg);
        Alert.alert('Error', errorMsg);
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const removeCoupon = async () => {
    try {
      setIsProcessing(true);
      const res = await cartApi.delete('api/cart/remove-coupon');

      if (res.data) {
        setCartData(res.data);
        const items =
          res.data?.items?.map((item: any) => ({
            id: item.id,
            productId: item.pid,
            name: item.pname,
            pack: '',
            price: item.price,
            originalPrice: item.actualPrice,
            quantity: item.quantity,
            image: item.imagePath,
          })) || [];
        setCartItems(items);

        setAppliedCoupon(null);
        setAppliedDiscount(0);
        setCouponCode('');
        setCouponError(null);
        Alert.alert('Success', 'Coupon removed successfully');
      }
    } catch (e: any) {
      console.log('removeCoupon error', e.response?.data || e.message);
      Alert.alert('Error', 'Failed to remove coupon');
    } finally {
      setIsProcessing(false);
    }
  };

  // ------------- PAYMENT -------------

  const resetPaymentForm = () => {
    setCardNumber('');
    setCardHolderName('');
    setExpiryDate('');
    setCvv('');
    setSelectedPaymentMethod('cod');
  };

 const processPaymentCheckout = async (
  paymentMethod: 'cod' | 'card',
  paymentDetails?: {
    cardNumber: string;
    cardHolderName: string;
    expiryDate: string;
    cvv: string;
  },
) => {
  try {
    setIsProcessing(true);

    const orderPayload: any = {
      addressId: selectedAddress?.id,
      deliveryInstructions: selectedCards
        .map(id => {
          const card = carddata.find(c => c.id === id);
          return card?.Title || '';
        })
        .filter(Boolean),
      couponCode: appliedCoupon?.code || null,
    };

    let response;

    if (paymentMethod === 'card') {
      const payload = {
        cardNumber: paymentDetails?.cardNumber,
        cardHolderName: paymentDetails?.cardHolderName,
        expiryDate: paymentDetails?.expiryDate,
        cvv: paymentDetails?.cvv,
      };

      response = await payApi.post('api/cart/pay-checkout', payload);
    } else {
      response = await payApi.post('api/cart/cod-checkout', orderPayload);
    }

    // ✅ CREATE ORDER OBJECT (🔥 NEW)
    const orderObject = {
      orderId: Date.now(),
      orderDate: new Date().toISOString(),
      status: 'confirmed',
      paymentMethod,
      items: cartItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      totalAmount: finalPayable,
      couponDiscount: couponDiscount,
      address: selectedAddress,
      deliveryInstructions: selectedCards
        .map(id => {
          const card = carddata.find(c => c.id === id);
          return card?.Title;
        })
        .filter(Boolean),
    };

    await saveOrderToHistory(orderObject);
    await clearCart();
    //added this except of alert

    setShowSuccessModal(true);
//     Alert.alert(
//   'Order Placed!',
//   'Your order has been placed successfully.',
//   [
//     {
//       text: 'View Orders',
//       onPress: () => router.push('/(customer)/profile'),
//     },
//   ]
// );


    return true;
  } catch (e: any) {
    console.log('Payment checkout error:', e.response?.data || e.message || e);
    const errorMsg = e.response?.data?.message || 'Failed to process payment';
    Alert.alert('Payment Failed', errorMsg);
    return false;
  } finally {
    setIsProcessing(false);
    setShowPaymentMethodModal(false);
    resetPaymentForm();
  }
};


  const validateCardDetails = () => {
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');

    if (!cleanedCardNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter card number');
      return false;
    }

    if (cleanedCardNumber.length !== 16) {
      Alert.alert('Validation Error', 'Card number must be 16 digits');
      return false;
    }

    if (!/^\d+$/.test(cleanedCardNumber)) {
      Alert.alert('Validation Error', 'Card number must contain only numbers');
      return false;
    }

    if (!cardHolderName.trim()) {
      Alert.alert('Validation Error', 'Please enter card holder name');
      return false;
    }

    if (!expiryDate.trim()) {
      Alert.alert('Validation Error', 'Please enter expiry date (MM/YY)');
      return false;
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(expiryDate)) {
      Alert.alert(
        'Validation Error',
        'Please enter valid expiry date in MM/YY format',
      );
      return false;
    }

    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expYear = parseInt(year, 10);
    const expMonth = parseInt(month, 10);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      Alert.alert('Validation Error', 'Card has expired');
      return false;
    }

    if (!cvv.trim()) {
      Alert.alert('Validation Error', 'Please enter CVV');
      return false;
    }

    if (cvv.length !== 3 || !/^\d+$/.test(cvv)) {
      Alert.alert('Validation Error', 'CVV must be 3 digits');
      return false;
    }

    return true;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts: string[] = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  // ------------- ADDRESS API / LOGIC -------------

  const loadSavedAddress = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_ADDRESS);
      if (raw) {
        const saved = JSON.parse(raw);
        setSelectedAddress(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved address:', e);
    }
  };

  const fetchAddressesFromApi = async () => {
    setLoadingApi(true);
    try {
      const res = await adressApi.get('/address/all');
      if (res.data && Array.isArray(res.data)) {
        const formatted = res.data.map((addr: any) => ({
          id: addr.id || addr._id || addr.addressId,
          title: addr.title || addr.addressType || 'Home',
          house: addr.house || addr.houseNo || addr.flatNo || '',
          street: addr.street || addr.buildingName || '',
          landmark: addr.landmark || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.pincode || addr.pinCode || '',
          name: addr.name || addr.receiverName || '',
          phone: addr.phone || addr.receiverNumber || '',
        }));

        setAddressesList(formatted);

        const savedRaw = await AsyncStorage.getItem(STORAGE_ADDRESS);
        let savedParsed: any = null;
        if (savedRaw) {
          savedParsed = JSON.parse(savedRaw);
        }

        if (savedParsed && savedParsed.id) {
          const found = formatted.find(a => a.id === savedParsed.id);
          if (found) {
            setSelectedAddress(found);
          } else if (formatted.length > 0) {
            setSelectedAddress(formatted[0]);
            await AsyncStorage.setItem(
              STORAGE_ADDRESS,
              JSON.stringify(formatted[0]),
            );
          }
        } else if (!selectedAddress && formatted.length > 0) {
          setSelectedAddress(formatted[0]);
          await AsyncStorage.setItem(
            STORAGE_ADDRESS,
            JSON.stringify(formatted[0]),
          );
        }
      } else {
        setAddressesList([]);
      }
    } catch (e: any) {
      console.error('Error fetching addresses:', e.response?.data || e.message || e);
      Alert.alert('Error', 'Failed to load addresses. Please try again.');
    } finally {
      setLoadingApi(false);
    }
  };

  const saveAddressToApi = async (addressData: any) => {
    try {
      setIsProcessing(true);
      let res;
      if (editingAddressId) {
        res = await adressApi.put(`/address/update/${editingAddressId}`, addressData);
      } else {
        res = await adressApi.post('/address/add', addressData);
      }

      if (res.data) {
        const body = res.data;
        const formatted = {
          id: body.id || body._id || body.addressId || editingAddressId,
          title: body.title || addressData.title,
          house: body.house || addressData.house,
          street: body.street || addressData.street,
          landmark: body.landmark || addressData.landmark,
          city: body.city || addressData.city,
          state: body.state || addressData.state,
          pincode: body.pincode || addressData.pincode,
          name: body.name || addressData.name,
          phone: body.phone || addressData.phone,
        };
        return formatted;
      }
      throw new Error('No data in response');
    } catch (e: any) {
      console.error('Save address error:', e.response?.data || e.message || e);
      throw new Error(
        e.response?.data?.message || e.message || 'Failed to save address',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteAddressFromApi = async (id: any) => {
    try {
      setIsProcessing(true);
      await adressApi.delete(`/address/delete/${id}`);

      setAddressesList(prev => prev.filter(a => a.id !== id));

      setSelectedAddress(prevSelected => {
        if (!prevSelected || prevSelected.id !== id) return prevSelected;

        // fresh remaining list
        const remaining = addressesList.filter(a => a.id !== id);
        const next = remaining[0] || null;

        if (next) {
          AsyncStorage.setItem(STORAGE_ADDRESS, JSON.stringify(next));
        } else {
          AsyncStorage.removeItem(STORAGE_ADDRESS);
        }
        return next;
      });

      Alert.alert('Success', 'Address deleted');
    } catch (e: any) {
      console.error('Delete API error:', e.response?.data || e.message || e);
      Alert.alert('Error', e.message || 'Failed to delete address');
    } finally {
      setIsProcessing(false);
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

  const handleSaveAddress = async () => {
    if (!flatNo || !buildingName || !city || !state || !pincode) {
      Alert.alert('Validation', 'Please fill all required fields');
      return;
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

    try {
      const saved = await saveAddressToApi(payload);

      setAddressesList(prev => {
        if (editingAddressId) {
          // update existing
          return prev.map(a => (a.id === saved.id ? saved : a));
        }
        // add new
        return [...prev, saved];
      });

      setSelectedAddress(saved);
      await AsyncStorage.setItem(STORAGE_ADDRESS, JSON.stringify(saved));

      resetAddressForm();
      setShowAddressModal(false);
      Alert.alert('Success', 'Address saved successfully');
    } catch (e: any) {
      console.error('Handle save address error:', e);
      Alert.alert('Error', e.message || 'Failed to save address');
    }
  };

  const selectAddress = async (address: any) => {
    setSelectedAddress(address);
    await AsyncStorage.setItem(STORAGE_ADDRESS, JSON.stringify(address));
  };

  const openAddAddressModal = () => {
    resetAddressForm();
    setEditingAddressId(null);
    setShowAddressModal(true);
  };

  const openEditAddressModal = (address: any) => {
    if (!address) return;
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
  };

  // ------------- RECENTLY ADDED -------------

  const loadRecentlyAddedProduct = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentlyAddedProduct');
      if (stored) {
        setRecentlyAddedProduct(JSON.parse(stored));
      } else {
        setRecentlyAddedProduct(null);
      }
    } catch (e) {
      console.log('Error loading recentlyAddedProduct:', e);
      setRecentlyAddedProduct(null);
    }
  };

  // ------------- UI HELPERS -------------

  useEffect(() => {
    loadSavedAddress();
    fetchAddressesFromApi();
    fetchCartItems();
    loadRecentlyAddedProduct();
    fetchAvailableCoupon();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCartItems();
      loadRecentlyAddedProduct();
    }, [])
  );

  useEffect(() => {
    if (passedProduct) {
      addItemToCart(passedProduct, 1);
    }
  }, [passedProduct]);

  const toggleCardSelection = (id: number) => {
    setSelectedCards(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const MemoCard = memo(({ item, isSelected, onPress }: any) => {
    let iconName: any = 'information-circle-outline';

    if (item.Title === 'Beware of pet') iconName = 'paw-outline';
    else if (item.Title === "Don't ring the bell")
      iconName = 'notifications-off-outline';
    else if (item.Title === "Don't contact") iconName = 'hand-left-outline';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        className={`bg-white mx-2 w-48 h-32 justify-center items-center shadow-sm border ${
          isSelected ? 'border-[#e6005c] bg-[#fff0f4]' : 'border-gray-200'
        } px-3`}
      >
        <Ionicons
          name={iconName}
          size={30}
          color={isSelected ? '#e6005c' : '#555'}
          style={{ marginBottom: 8 }}
        />
        <Text
          className={`text-base font-bold text-center ${
            isSelected ? 'text-[#e6005c]' : 'text-black'
          }`}
        >
          {item.Title}
        </Text>
      </TouchableOpacity>
    );
  });

  const renderCard = ({ item }: any) => {
    const isSelected = selectedCards.includes(item.id);
    return (
      <MemoCard
        item={item}
        isSelected={isSelected}
        onPress={() => toggleCardSelection(item.id)}
      />
    );
  };

  const HorizontalcardList = () => (
    <FlatList
      data={carddata}
      renderItem={renderCard}
      keyExtractor={item => String(item.id)}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 8 }}
    />
  );

  const changeQuantity = async (id: any, change: number) => {
    const current = cartItems.find(it => it.id === id);
    if (!current) return;
    const newQty = Math.max(1, current.quantity + change);
    await updateCartItemQuantity(id, newQty);
  };

  // ------------- BILL CALCULATIONS -------------

  // Get subtotal from cartData or calculate from items
  const getSubtotal = () => {
  if (cartItems.length === 0) return 0;

  return cartItems.reduce(
    (sum, item) =>
      sum + (item.originalPrice || item.price) * item.quantity,
    0
  );
};


  // Get discounted total (after item discounts but before coupon)
 const getDiscountedTotal = () => {
  if (cartItems.length === 0) return 0;

  return cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
};

  // Get coupon discount from cartData or appliedDiscount
  const getCouponDiscount = () => {
    return cartData?.discountAmount || appliedDiscount || 0;
  };

  // Get final payable amount
 const getFinalPayable = () => {
  const discountedTotal = getDiscountedTotal();
  const couponDiscount = getCouponDiscount();

  return Math.max(0, discountedTotal - couponDiscount);
};


  const applyCouponObj = (coupon: any) => {
    if (!coupon) {
      Alert.alert('Error', 'Invalid coupon');
      return;
    }
    
    const discountedTotal = getDiscountedTotal();
    
    if (coupon.minOrder && discountedTotal < coupon.minOrder) {
      Alert.alert(
        'Minimum Order Required',
        `Offer applicable on total payable amount above ₹${coupon.minOrder}.`,
      );
      return;
    }

    let discount = 0;
    if (coupon.type === 'fixed_range' || coupon.type === 'fixed') {
      discount = coupon.discountValue || coupon.minSavings || coupon.discount || 0;
    } else if (coupon.type === 'percent') {
      discount = Math.floor(
        (discountedTotal *
          (coupon.percent || coupon.discountPercent || 0)) /
          100,
      );
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    // Apply coupon via API
    applyCoupon(coupon.code);
    setShowCouponsModal(false);
  };

  const applyCouponByCode = () => {
    const code = (couponCode || '').trim().toUpperCase();
    if (!code) {
      Alert.alert('Error', 'Enter coupon code');
      return;
    }
    const found = availableCoupons.find(
      (c: any) => c.code.toUpperCase() === code,
    );
    if (!found) {
      Alert.alert('Error', 'Invalid coupon code');
      return;
    }
    applyCoupon(found.code);
    setShowCouponsModal(false);

  };

  const renderOtherAddresses = () => {
    const otherAddresses = addressesList.filter(
      addr => !selectedAddress || addr.id !== selectedAddress.id,
    );
    if (otherAddresses.length === 0) return null;

    return (
      <View className="mb-3">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-semibold text-gray-800">
            Other Addresses
          </Text>
          <TouchableOpacity
            onPress={() =>
              setShowAllOtherAddresses(!showAllOtherAddresses)
            }
          >
            <Ionicons
              name={showAllOtherAddresses ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {showAllOtherAddresses &&
          otherAddresses.map(address => (
            <TouchableOpacity
              key={address.id}
              className="bg-gray-50 p-3 mb-2 border border-gray-200"
              onPress={() => selectAddress(address)}
            >
              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm text-[#e6005c] font-semibold">
                    {address.title || 'Address'}
                  </Text>
                  <TouchableOpacity
                    className="p-1"
                    onPress={() => openEditAddressModal(address)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={isProcessing}
                  >
                    <Ionicons name="pencil" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-800 leading-5 mb-1">
                  {address.house || ''}, {address.street || ''}{' '}
                  {address.city || ''}
                </Text>
                {address.landmark ? (
                  <Text className="text-xs text-gray-600 italic">
                    Landmark: {address.landmark}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
      </View>
    );
  };

  const handlePaymentConfirmation = () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setShowPaymentMethodModal(true);
  };

  const handlePaymentSubmission = async () => {
    if (selectedPaymentMethod === 'cod') {
      await processPaymentCheckout('cod');
    } else {
      if (!validateCardDetails()) return;

      const paymentDetails = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardHolderName,
        expiryDate,
        cvv,
      };

      await processPaymentCheckout('card', paymentDetails);
    }
  };

  // Calculate values for display
  const subtotal = getSubtotal();
  const discountedTotal = getDiscountedTotal();
  const couponDiscount = getCouponDiscount();
  const finalPayable = getFinalPayable();

  // ------------- UI -------------

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-3 border-b border-gray-200 bg-white">
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >
        {/* CART ITEMS */}
        <View className="px-4 mb-3 mt-2">
          {cartItems.map(item => (
            <View
              key={item.id}
              className="flex-row mb-4 items-center border-b border-gray-100 pb-3"
            >
              <Image
                source={{ uri: item.image }}
                className="w-16 h-16 rounded bg-gray-100"
              />
              <View className="flex-1 ml-3">
                <Text className="text-base font-bold text-black mb-1">
                  {item.name}
                </Text>
                <Text className="text-sm text-gray-600 mb-2">
                  {item.pack}
                </Text>
                <View className="flex-row items-center bg-white rounded border border-[#f4d8d8] self-start py-1 px-1.5">
                  <TouchableOpacity
                    className="px-2 py-1"
                    onPress={() => changeQuantity(item.id, -1)}
                  >
                    <Text className="text-lg text-[#e63a00] font-semibold">
                      −
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-base font-semibold text-[#e65c00] mx-2">
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    className="px-2 py-1"
                    onPress={() => changeQuantity(item.id, 1)}
                  >
                    <Text className="text-lg text-[#e63a00] font-semibold">
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="ml-2 items-end">
                <Text className="text-base font-bold text-black">
                  ₹{item.price * item.quantity}
                </Text>
                <Text className="text-sm text-gray-400 line-through mt-1">
                  ₹{(item.originalPrice || item.price) * item.quantity}
                </Text>
                <TouchableOpacity
                  className="mt-1"
                  onPress={() => deleteCartItem(item.id)}
                  disabled={isProcessing}
                >
                  <Text className="text-xs text-red-500 font-semibold">
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Recently added */}
        {recentlyAddedProduct && (
          <View className="mx-4 mt-2 mb-2 bg-white rounded-2xl p-4 shadow-sm border border-green-200">
            <View className="flex-row items-center mb-3">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            </View>
            <View className="flex-row items-center">
              <Image
                source={{ uri: recentlyAddedProduct.imagePath }}
                className="w-16 h-16 rounded-lg mr-3 bg-gray-100"
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
                <Text className="text-xs text-gray-500">
                  1 item • In cart
                </Text>
              </View>
              <TouchableOpacity
                className="py-2 px-3 rounded bg-gray-100"
                onPress={async () => {
                  setRecentlyAddedProduct(null);
                  await AsyncStorage.removeItem('recentlyAddedProduct');
                }}
              >
                <Text className="text-xs font-semibold text-gray-700">
                  Hide
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add more items */}
        <View className="flex-row items-center justify-between px-4 mb-3 mt-1.5">
          <Text className="text-base font-semibold text-gray-900">
            Add something?
          </Text>
          <TouchableOpacity
            className="flex-row items-center bg-[#e6005c] py-2.5 px-3.5 rounded"
            activeOpacity={0.9}
            onPress={() => router.push('/(customer)/home')}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-white font-bold text-sm ml-1">
              Add More Items
            </Text>
          </TouchableOpacity>
        </View>

        {/* Coupons */}
        <TouchableOpacity
          className="flex-row items-center bg-[#fff] mx-4 rounded py-3 px-3.5 justify-between mb-3 border border-[#fff0e6]"
          onPress={() => setShowCouponsModal(true)}
        >
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded bg-[#e6ffef] items-center justify-center mr-3">
              <Ionicons name="pricetag" size={18} color="#00a86b" />
            </View>
            <View>
              <Text className="font-bold text-gray-900">
                View Coupons & Offers
              </Text>
              {appliedCoupon && (
                <Text className="text-xs text-green-600 mt-1">
                  {appliedCoupon.code} applied • Save ₹{couponDiscount}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        {/* Bill summary - UPDATED AS PER IMAGE */}
        <View className="bg-gray-50 rounded mx-4 p-4 mb-5">
          <View className="flex-row items-center mb-3">
            <Ionicons name="document-text" size={20} color="#333" />
            <Text className="text-lg font-bold ml-2 text-black">
              Bill summary
            </Text>
          </View>

          <View className="flex-row justify-between items-center my-2">
            <Text className="text-sm text-gray-600">Item Total:</Text>
            <View className="flex-row items-center">
              {/* Agar original price zyada hai toh crossed out dikhaye */}
              {subtotal > discountedTotal ? (
                <Text className="text-sm text-gray-400 line-through mr-2">
                  ₹{subtotal.toFixed(2)}
                </Text>
              ) : null}
              <Text className="text-sm font-semibold text-black">
                ₹{discountedTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center my-2">
            <Text className="text-sm text-gray-600">Handling Fee:</Text>
            <View className="flex-row items-center">
              {/* SIRF CROSSED OUT PRICE - NO "FREE" TEXT */}
              <Text className="text-sm text-gray-400 line-through">
                ₹10.00
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center my-2">
            <Text className="text-sm text-gray-600">Delivery Fee:</Text>
            <View className="flex-row items-center">
              {/* SIRF CROSSED OUT PRICE - NO "FREE" TEXT */}
              <Text className="text-sm text-gray-400 line-through">
                ₹30.00
              </Text>
            </View>
          </View>

          {couponDiscount > 0 && (
            <>
              <View className="h-px bg-gray-300 my-3" />
              <View className="flex-row justify-between items-center my-2">
                <View className="flex-row items-center">
                  <Text className="text-sm text-gray-600 mr-2">
                    Coupon ({appliedCoupon?.code || 'Discount'})
                  </Text>
                  <TouchableOpacity
                    onPress={removeCoupon}
                    disabled={isProcessing}
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color="#ff4444"
                    />
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-sm font-semibold text-[#00a86b]">
                    - ₹{couponDiscount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View className="h-px bg-gray-300 my-3" />

          <View className="flex-row justify-between items-center my-2">
            <Text className="text-base font-bold text-black">To Pay:</Text>
            <View className="flex-row items-center">
              {/* Agar coupon hai toh original price crossed out dikhaye */}
              {couponDiscount > 0 ? (
                <>
                  <Text className="text-sm text-gray-400 line-through mr-2">
                    ₹{discountedTotal.toFixed(2)}
                  </Text>
                  <Text className="text-base font-bold text-black">
                    ₹{finalPayable.toFixed(2)}
                  </Text>
                </>
              ) : (
                <Text className="text-base font-bold text-black">
                  ₹{finalPayable.toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Delivery Instruction */}
        <View className="mb-5">
          <View className="flex-row items-center mb-2 px-4">
            <Ionicons
              name="chatbox-ellipses-outline"
              size={20}
              color="#333"
            />
            <Text className="text-lg font-bold ml-2 text-black">
              Delivery Instruction
            </Text>
          </View>
          <Text className="text-gray-600 mb-2 text-xs px-4">
            Delivery partner will be notified
          </Text>
          <HorizontalcardList />
        </View>

        {/* Address block */}
        {selectedAddress ? (
          <View className="px-4 pb-5 bg-white mt-2">
            <View className="flex-row items-start bg-[#fff8fb] p-3 border border-[#ffe5f0] mb-3 shadow-sm">
              <View className="flex-1">
                <Text className="text-sm text-[#e6005c] font-bold mb-1">
                  {selectedAddress.title || 'Address'} Address
                </Text>
                <Text className="text-sm text-gray-800 mb-1 leading-4">
                  {selectedAddress.house
                    ? `${selectedAddress.house}, `
                    : ''}
                  {selectedAddress.street || ''}
                </Text>
                {selectedAddress.landmark ? (
                  <Text className="text-sm text-gray-800 mb-1 leading-4">
                    Landmark: {selectedAddress.landmark}
                  </Text>
                ) : null}
                <Text className="text-sm text-gray-800 mb-1 leading-4">
                  {selectedAddress.city
                    ? `${selectedAddress.city}, `
                    : ''}
                  {selectedAddress.state || ''}
                  {selectedAddress.pincode
                    ? ` - ${selectedAddress.pincode}`
                    : ''}
                </Text>
                <Text className="text-sm text-gray-800 mb-1 leading-4">
                  Receiver: {selectedAddress.name || 'Not specified'}
                </Text>
                <Text className="text-sm text-gray-800 mb-1 leading-4">
                  Phone: {selectedAddress.phone || 'Not specified'}
                </Text>
              </View>
              <View className="ml-3 items-end">
                <TouchableOpacity
                  className="py-1.5 px-2.5 bg-white rounded border border-[#e6005c] mb-1.5 min-w-[60px] items-center justify-center h-8"
                  onPress={() => openEditAddressModal(selectedAddress)}
                  disabled={isProcessing}
                >
                  <Text className="text-[#e6005c] font-bold text-xs">
                    Edit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-1.5 px-2.5 bg-[#fef2f2] rounded border border-[#fca5a5] min-w-[60px] items-center justify-center h-8"
                  onPress={() => deleteAddressFromApi(selectedAddress.id)}
                  disabled={isProcessing}
                >
                  <Text className="text-[#c02626] font-bold text-xs">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-center bg-gray-50 p-3 border border-gray-200 mb-4"
              onPress={openAddAddressModal}
              disabled={isProcessing}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#e6005c"
              />
              <Text className="text-sm text-[#e6005c] font-semibold ml-2">
                Add New Address
              </Text>
            </TouchableOpacity>

            {renderOtherAddresses()}
          </View>
        ) : (
          <View className="px-6 py-5 items-center">
            <Text className="text-base text-gray-600 mb-3">
              No address selected
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-center bg-gray-50 p-3 border border-gray-200 w-full"
              onPress={openAddAddressModal}
              disabled={isProcessing}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#e6005c"
              />
              <Text className="text-sm text-[#e6005c] font-semibold ml-2">
                Add Your First Address
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pay button */}
        <View className="px-6 pb-10 pt-1">
          <TouchableOpacity
            className="bg-[#e6005c] rounded py-4 items-center justify-center shadow-md"
            onPress={handlePaymentConfirmation}
            disabled={isProcessing || cartItems.length === 0}
          >
            <Text className="text-white text-base font-semibold">
              {isProcessing
                ? 'Processing...'
                : cartItems.length === 0
                ? 'Cart is Empty'
                : selectedAddress
                ? `Pay ₹${finalPayable.toFixed(2)}`
                : 'Add Address to proceed'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {(loadingApi || isProcessing) && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-white/80 justify-center items-center z-50">
          <ActivityIndicator size="small" color="#e6005c" />
          <Text className="ml-2 text-sm text-gray-600">
            {isProcessing ? 'Processing...' : 'Loading...'}
          </Text>
        </View>
      )}

      {/* Address Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isProcessing) setShowAddressModal(false);
        }}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-2xl p-4 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-black">
                {editingAddressId ? 'Edit Address' : 'Add Address'}
              </Text>
              <TouchableOpacity
                onPress={() => !isProcessing && setShowAddressModal(false)}
              >
                <Ionicons name="close" size={22} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs text-gray-600 mb-1">Address Type</Text>
              <View className="flex-row mb-3">
                {['Home', 'Work', 'Other'].map(type => (
                  <TouchableOpacity
                    key={type}
                    className={`px-3 py-1.5 mr-2 rounded-full border ${
                      addressType === type
                        ? 'border-[#e6005c] bg-[#fff0f4]'
                        : 'border-gray-300'
                    }`}
                    onPress={() => setAddressType(type)}
                  >
                    <Text
                      className={`text-xs ${
                        addressType === type
                          ? 'text-[#e6005c]'
                          : 'text-gray-700'
                      }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-xs text-gray-600 mb-1">Flat / House no.</Text>
              <TextInput
                value={flatNo}
                onChangeText={setFlatNo}
                placeholder="Flat / House no."
                className="border border-gray-300 rounded px-3 py-2 text-sm mb-3"
              />

              <Text className="text-xs text-gray-600 mb-1">
                Building / Street
              </Text>
              <TextInput
                value={buildingName}
                onChangeText={setBuildingName}
                placeholder="Building / Street"
                className="border border-gray-300 rounded px-3 py-2 text-sm mb-3"
              />

              <Text className="text-xs text-gray-600 mb-1">Landmark (optional)</Text>
              <TextInput
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Nearby landmark"
                className="border border-gray-300 rounded px-3 py-2 text-sm mb-3"
              />

              <Text className="text-xs text-gray-600 mb-1">City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City"
                className="border border-gray-300 rounded px-3 py-2 text-sm mb-3"
              />

              <Text className="text-xs text-gray-600 mb-1">State</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="State"
                className="border border-gray-300 rounded px-3 py-2 text-sm mb-3"
              />

              <Text className="text-xs text-gray-600 mb-1">Pincode</Text>
              <TextInput
                value={pincode}
                onChangeText={setPincode}
                placeholder="Pincode"
                keyboardType="numeric"
                className="border border-gray-300 rounded px-3 py-2 text-sm mb-3"
              />

              <Text className="text-xs text-gray-600 mb-1">
                Receiver Name (optional)
              </Text>
              <TextInput
                value={receiverName}
                onChangeText={setReceiverName}
                placeholder="Receiver name"
                className="border border-gray-300 rounded px-3 py-2 text-sm mb-3"
              />

              <Text className="text-xs text-gray-600 mb-1">
                Receiver Phone (optional)
              </Text>
              <TextInput
                value={receiverNumber}
                onChangeText={setReceiverNumber}
                placeholder="Phone"
                keyboardType="phone-pad"
                className="border border-gray-300 rounded px-3 py-2 text-sm mb-6"
              />
            </ScrollView>

            <TouchableOpacity
              className="bg-[#e6005c] rounded py-3 items-center justify-center mt-2"
              onPress={handleSaveAddress}
              disabled={isProcessing}
            >
              <Text className="text-white text-base font-semibold">
                {editingAddressId ? 'Update Address' : 'Save Address'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentMethodModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isProcessing) setShowPaymentMethodModal(false);
        }}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
            <Text className="text-lg font-bold text-black">Payment Method</Text>
            <TouchableOpacity
              onPress={() => !isProcessing && setShowPaymentMethodModal(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-4">
              <TouchableOpacity
                className={`p-4 border rounded mb-3 ${
                  selectedPaymentMethod === 'cod'
                    ? 'border-[#e6005c] bg-[#fff0f4]'
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => setSelectedPaymentMethod('cod')}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                      selectedPaymentMethod === 'cod'
                        ? 'border-[#e6005c] bg-[#e6005c]'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedPaymentMethod === 'cod' && (
                      <View className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-black">
                      Cash on Delivery
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Pay when you receive
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className={`p-4 border rounded mb-3 ${
                  selectedPaymentMethod === 'card'
                    ? 'border-[#e6005c] bg-[#fff0f4]'
                    : 'border-gray-200 bg-white'
                }`}
                onPress={() => setSelectedPaymentMethod('card')}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                      selectedPaymentMethod === 'card'
                        ? 'border-[#e6005c] bg-[#e6005c]'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedPaymentMethod === 'card' && (
                      <View className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-black">
                      Credit/Debit Card
                    </Text>
                    <Text className="text-sm text-gray-600">Secure payment</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {selectedPaymentMethod === 'card' && (
                <View className="bg-gray-50 p-4 rounded mt-4 mb-4">
                  <Text className="text-sm font-semibold text-gray-800 mb-3">
                    Card Details
                  </Text>

                  <Text className="text-xs text-gray-600 mb-1">Card Number</Text>
                  <TextInput
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChangeText={v => setCardNumber(formatCardNumber(v))}
                    keyboardType="numeric"
                    maxLength={19}
                    className="border border-gray-300 rounded px-3 py-2 text-sm mb-3"
                  />

                  <Text className="text-xs text-gray-600 mb-1">
                    Card Holder Name
                  </Text>
                  <TextInput
                    placeholder="John Doe"
                    value={cardHolderName}
                    onChangeText={setCardHolderName}
                    className="border border-gray-300 rounded px-3 py-2 text-sm mb-3"
                  />

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-xs text-gray-600 mb-1">
                        Expiry (MM/YY)
                      </Text>
                      <TextInput
                        placeholder="12/25"
                        value={expiryDate}
                        onChangeText={v => setExpiryDate(formatExpiryDate(v))}
                        keyboardType="numeric"
                        maxLength={5}
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-600 mb-1">CVV</Text>
                      <TextInput
                        placeholder="123"
                        value={cvv}
                        onChangeText={setCvv}
                        keyboardType="numeric"
                        maxLength={3}
                        secureTextEntry
                        className="border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View className="px-4 py-4 border-t border-gray-200">
            <TouchableOpacity
              className="bg-[#e6005c] rounded py-4 items-center justify-center"
              onPress={handlePaymentSubmission}
              disabled={isProcessing}
            >
              <Text className="text-white text-base font-semibold">
                {isProcessing ? 'Processing...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Coupons Modal */}
      <Modal
        visible={showCouponsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCouponsModal(false)}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200">
            <Text className="text-lg font-bold text-black">Available Coupons</Text>
            <TouchableOpacity onPress={() => setShowCouponsModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-4">
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-800 mb-2">Enter Coupon Code</Text>
                <TextInput
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  className="border border-gray-300 rounded px-3 py-2 text-sm mb-2"
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  className="bg-[#e6005c] rounded py-2 items-center"
                  onPress={applyCouponByCode}
                  disabled={isProcessing}
                >
                  <Text className="text-white font-semibold">Apply Code</Text>
                </TouchableOpacity>
                {couponError && (
                  <Text className="text-red-500 text-xs mt-1">{couponError}</Text>
                )}
              </View>

              <Text className="text-sm font-semibold text-gray-800 mb-3">Available Coupons</Text>
              {couponsLoading ? (
                <ActivityIndicator size="small" color="#e6005c" />
              ) : availableCoupons.length > 0 ? (
                availableCoupons.map((coupon: any) => {
                  const displayTitle = getCouponDisplayTitle(coupon);
                  const description = coupon.description || getCouponDescription(coupon);
                  
                  return (
                    <TouchableOpacity
                      key={coupon.id || coupon.code}
                      className="bg-gray-50 p-3 mb-2 rounded border border-gray-200"
                      onPress={() => applyCouponObj(coupon)}
                      disabled={isProcessing}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                          <Text className="font-bold text-gray-800">{coupon.code}</Text>
                          <Text className="text-xs text-gray-600 mt-1">{description}</Text>
                          {coupon.minOrder > 0 && (
                            <Text className="text-xs text-orange-600 mt-1">
                              Min order: ₹{coupon.minOrder}
                            </Text>
                          )}
                        </View>
                        <View className="items-end">
                          <Text className="text-sm font-semibold text-green-600">
                            {displayTitle}
                          </Text>
                          {coupon.type === 'percent' && coupon.maxDiscount > 0 && (
                            <Text className="text-xs text-gray-500">Max ₹{coupon.maxDiscount}</Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text className="text-gray-500 text-center py-4">No coupons available</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* In this part when we complete our order then it will show thanks for ordering your order will reach soon... */}

       <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white w-full rounded-2xl p-6 items-center">

            <Ionicons
              name="checkmark-circle"
              size={72}
              color="#16a34a"
              style={{ marginBottom: 12 }}
            />

            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Thanks for Ordering 🎉
            </Text>

            <Text className="text-sm text-gray-600 text-center mb-6">
              Your order will be dispatched soon within{" "}
              <Text className="font-bold text-black">10 minutes</Text>.
            </Text>

            <TouchableOpacity
              className="bg-[#e6005c] px-8 py-3 rounded-full"
              onPress={() => {
                setShowSuccessModal(false);
                router.push('/(customer)/profile');
              }}
            >
              <Text className="text-white font-bold text-base">
                View My Orders
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};
export default CartScreen;
