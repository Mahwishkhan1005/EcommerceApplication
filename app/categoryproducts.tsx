

import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image, Platform,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View
} from "react-native";


type Product = {
  pid: number; pname: string; description: string; price: number;
  stockQuantity: number; imagePath: string; actualPrice: number;
  discount: number; rating: number;
};

const CategoryProducts = () => {
  const { cid, cname } = useLocalSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistPids, setWishlistPids] = useState<number[]>([]);
  
  const isWeb = Platform.OS === 'web';


  useEffect(() => {
    if (cid) fetchProductsByCategory();
  }, [cid]);

  const fetchProductsByCategory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://192.168.0.200:8080/api/admin/products/category/${cid}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching category products:", error);
    } finally {
      setLoading(false);
    }
  };


  useFocusEffect(
    useCallback(() => {
      const fetchWishlistFromServer = async () => {
        try {
          
          const response = await axios.get("http://192.168.0.186:8080/api/wishlist/all");
          const pids = response.data.map((item: any) => item.pid);
          setWishlistPids(pids);
        } catch (error) {
          console.error("Error fetching wishlist:", error);
        }
      };
      fetchWishlistFromServer();
    }, [])
  );

 
  const handleToggleWishlist = async (product: Product) => {
    if (!product || !product.pid) return;

    try {
      const stored = await AsyncStorage.getItem("user_wishlist");
      let currentWishlist = stored ? JSON.parse(stored) : [];
      currentWishlist = currentWishlist.filter((i: any) => i !== null);

      const exists = currentWishlist.find((item: any) => item.pid === product.pid);
      let updatedWishlist;

      if (exists) {
        updatedWishlist = currentWishlist.filter((item: any) => item.pid !== product.pid);
      } else {
        updatedWishlist = [...currentWishlist, product];
      }

      await AsyncStorage.setItem("user_wishlist", JSON.stringify(updatedWishlist));
      setWishlistPids(updatedWishlist.map((i: any) => i.pid)); 

      if (Platform.OS !== 'web') {
        Alert.alert(exists ? "Removed" : "Added", exists ? "Removed from wishlist" : "Added to wishlist! ❤️");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
     
      <View className="flex-row items-center p-5 bg-white border-b border-gray-100">
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
          key={isWeb ? 'web-grid' : 'mobile-grid'}
          columnWrapperStyle={{ justifyContent: 'flex-start', paddingHorizontal: 10 }}
          contentContainerStyle={{ paddingTop: 15, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-gray-500">No products found in this category.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isFavourite = wishlistPids.includes(item.pid);
            return (
              <View 
                className={`${isWeb ? 'w-48' : 'flex-1'} bg-white rounded-2xl p-3 m-2 border border-gray-100 shadow-sm`} 
                style={{ elevation: 3 }}
              >
                <Image 
                  source={{ uri: item.imagePath || 'https://via.placeholder.com/150' }} 
                  className="w-full h-24 mb-2"
                  resizeMode="contain" 
                />

                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Text className="text-base font-bold text-black">₹{item.price}</Text>
                    <Text className="text-xs text-gray-400 line-through ml-2">₹{item.actualPrice}</Text>
                  </View>
                </View>

                <View className="mt-2 flex-row justify-between items-center" >
                  <Text numberOfLines={2} className="text-sm font-semibold text-gray-800 h-10 flex-1">
                    {item.pname}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-[10px] text-green-600 font-bold">{item.discount}% OFF</Text>
                  <Text className="text-xs font-bold">⭐ {item.rating || '4.5'}</Text>
                </View>

                <View className="flex-row justify-between">
                  <TouchableOpacity className="flex-1 bg-[#590080] py-2 rounded-lg items-center mr-2">
                    <Text className="text-white text-xs font-bold">ADD</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
            className="p-2 rounded-lg w-10 items-center justify-center" 
            style={{ backgroundColor: isFavourite ? '#FF80BF' : '#ff80bf' }}
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
    </SafeAreaView>
  );
};

export default CategoryProducts;