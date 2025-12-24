// import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Image,
//   Platform,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// type Product = {
//   pid: number;
//   pname: string;
//   description: string;
//   price: number;
//   stockQuantity: number;
//   imagePath: string;
//   actualPrice: number;
//   discount: number;
//   rating: number;
// };

// const CategoryProducts = () => {
//   const { cid, cname } = useLocalSearchParams();
//   const router = useRouter();
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [wishlistPids, setWishlistPids] = useState<number[]>([]);
//   const [wishlistItems, setWishlistItems] = useState<
//     { pid: number; itemId: string }[]
//   >([]);

//   const isWeb = Platform.OS === "web";

//   useEffect(() => {
//     if (cid) fetchProductsByCategory();
//   }, [cid]);

//   const fetchProductsByCategory = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(
//         `http://192.168.0.219:8081/api/admin/products/category/${cid}`
//       );
//       setProducts(response.data);
//     } catch (error) {
//       console.error("Error fetching category products:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (cid) fetchProductsByCategory();
//     syncWishlistWithServer();
//   }, [cid]);

//   const syncWishlistWithServer = async () => {
//     try {
//       const token = await AsyncStorage.getItem("AccessToken");
//       if (!token) return;

//       const response = await axios.get(
//         "http://192.168.0.219:8082/api/wishlist/byId",
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (response.data && Array.isArray(response.data.items)) {
//         const pids = response.data.items.map((item: any) => item.pid);
//         setWishlistPids(pids);
//         setWishlistItems(response.data.items);
//       }
//     } catch (error) {
//       console.error("Error syncing wishlist:", error);
//     }
//   };

//   const handleToggleWishlist = async (product: Product) => {
//     if (!product || !product.pid) return;

//     const token = await AsyncStorage.getItem("AccessToken");
//     if (!token) {
//       Alert.alert(
//         "Login Required",
//         "Please log in to add items to your wishlist."
//       );
//       return;
//     }

//     const config = { headers: { Authorization: `Bearer ${token}` } };

//     // Check if it's already in wishlist
//     const isFavourite = wishlistPids.includes(product.pid);
//     const existingItem = wishlistItems.find((item) => item.pid === product.pid);

//     // --- STEP 1: OPTIMISTIC UI UPDATE ---
//     // We update the heart icon IMMEDIATELY
//     if (isFavourite) {
//       setWishlistPids((prev) => prev.filter((id) => id !== product.pid));
//     } else {
//       setWishlistPids((prev) => [...prev, product.pid]);
//     }

//     try {
//       if (isFavourite) {
//         // --- STEP 2: REMOVE FROM SERVER ---
//         // Use itemId (UUID) if available, otherwise fallback to pid if your API supports it
//         const identifier = existingItem?.itemId;
//         if (identifier) {
//           await axios.delete(
//             `http://192.168.0.219:8082/api/wishlist/remove/${identifier}`,
//             config
//           );
//         }
//       } else {
//         // --- STEP 3: ADD TO SERVER ---
//         await axios.post(
//           `http://192.168.0.219:8082/api/wishlist/add`,
//           { pid: product.pid },
//           config
//         );
//       }

//       // --- STEP 4: RE-SYNC DATA ---
//       // Refresh the full list from server to get the new UUIDs for future removals
//       await syncWishlistWithServer();
//     } catch (error) {
//       // --- STEP 5: ROLLBACK ON ERROR ---
//       // If the server fails, revert the heart icon to its previous state
//       console.error("Wishlist Error:", error);
//       if (isFavourite) {
//         setWishlistPids((prev) => [...prev, product.pid]);
//       } else {
//         setWishlistPids((prev) => prev.filter((id) => id !== product.pid));
//       }
//       Alert.alert("Error", "Could not update wishlist. Please try again.");
//     }
//   };
//   return (
//     <View className="flex-1 bg-gray-50">
//       <View
//         className={`${isWeb ? "flex-row items-center p-5 bg-white border-b border-gray-100" : "flex-row items-center p-5 mt-8  bg-white border-b border-gray-100"}`}
//       >
//         <TouchableOpacity onPress={() => router.back()} className="pr-4">
//           <FontAwesome name="arrow-left" size={20} color="#590080" />
//         </TouchableOpacity>
//         <Text className="text-xl font-bold text-[#590080]">{cname}</Text>
//       </View>

//       {loading ? (
//         <View className="flex-1 justify-center items-center">
//           <ActivityIndicator size="large" color="#590080" />
//         </View>
//       ) : (
//         <FlatList
//           data={products}
//           keyExtractor={(item) => item.pid.toString()}
//           numColumns={isWeb ? 6 : 2}
//           key={isWeb ? "web-grid" : "mobile-grid"}
//           columnWrapperStyle={{
//             justifyContent: "flex-start",
//             paddingHorizontal: 10,
//           }}
//           contentContainerStyle={{ paddingTop: 15, paddingBottom: 20 }}
//           ListEmptyComponent={
//             <View className="items-center mt-20">
//               <Text className="text-gray-500">
//                 No products found in this category.
//               </Text>
//             </View>
//           }
//           renderItem={({ item }) => {
//             const isFavourite = wishlistPids.includes(item.pid);
//             return (
//               <View
//                 className={`${isWeb ? "w-48" : "flex-1"} bg-white rounded-2xl p-3 m-2 border border-gray-100 shadow-sm`}
//                 style={{ elevation: 3 }}
//               >
//                 <Image
//                   source={{
//                     uri: item.imagePath || "https://via.placeholder.com/150",
//                   }}
//                   className="w-full h-24 mb-2"
//                   resizeMode="contain"
//                 />

//                 <View className="flex-row justify-between items-center">
//                   <View className="flex-row items-center">
//                     <Text className="text-base font-bold text-black">
//                       ₹{item.price}
//                     </Text>
//                     <Text className="text-xs text-gray-400 line-through ml-2">
//                       ₹{item.actualPrice}
//                     </Text>
//                   </View>
//                 </View>

//                 <View className="mt-2 flex-row justify-between items-center">
//                   <Text
//                     numberOfLines={2}
//                     className="text-sm font-semibold text-gray-800 h-10 flex-1"
//                   >
//                     {item.pname}
//                   </Text>
//                 </View>

//                 <View className="flex-row justify-between items-center mb-3">
//                   <Text className="text-[10px] text-green-600 font-bold">
//                     {item.discount}% OFF
//                   </Text>
//                   <Text className="text-xs font-bold">
//                     ⭐ {item.rating || "4.5"}
//                   </Text>
//                 </View>

//                 <View className="flex-row justify-between">
//                   <TouchableOpacity className="flex-1 bg-[#590080] py-2 rounded-lg items-center mr-2">
//                     <Text className="text-white text-xs font-bold">ADD</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     className="p-2 rounded-lg w-10 items-center justify-center"
//                     style={{
//                       backgroundColor: isFavourite ? "#FF80BF" : "#ff80bf",
//                     }}
//                     onPress={() => handleToggleWishlist(item)}
//                   >
//                     <FontAwesome5
//                       name="heart"
//                       size={16}
//                       color={isFavourite ? "#ff3385" : "#fff"}
//                       solid={isFavourite}
//                     />
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             );
//           }}
//         />
//       )}
//     </View>
//   );
// };

// export default CategoryProducts;
// function useCallback(
//   arg0: () => void,
//   arg1: never[]
// ): () => undefined | void | (() => void) {
//   throw new Error("Function not implemented.");
// }

import { useStore } from "@/context/WishlistContext"; // 1. Import your context
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Type definition
type Product = {
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

const CategoryProducts = () => {
  const { cid, cname } = useLocalSearchParams();
  const router = useRouter();

  // 2. Consume wishlist and sync functions from Global Store
  const { wishlist, syncWishlist } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (cid) fetchProductsByCategory();
    fetchWishlistFromServer(); // Sync on mount
  }, [cid]);

  const fetchProductsByCategory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://192.168.0.225:8081/api/admin/products/category/${cid}`
      );
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching category products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistFromServer = async () => {
    try {
      const token = await AsyncStorage.getItem("AccessToken");
      if (!token) return;

      const response = await axios.get(
        "http://192.168.0.225:8082/api/wishlist/byId",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the global context with data from server
      if (Array.isArray(response.data)) {
        syncWishlist(response.data);
      }
    } catch (error) {
      console.error("Error syncing wishlist:", error);
    }
  };

  const handleToggleWishlist = async (product: Product) => {
    if (!product || !product.pid) return;

    const token = await AsyncStorage.getItem("AccessToken");
    if (!token) {
      Alert.alert("Login Required", "Please log in to manage your wishlist.");
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Find if the item exists in the global wishlist state
    const existingWishlistItem = wishlist.find(
      (item: any) => item.pid === product.pid
    );

    try {
      if (existingWishlistItem) {
        // --- REMOVE LOGIC ---
        const identifier =
          existingWishlistItem.itemId || existingWishlistItem.id;

        // Optimistic Update: Update Global UI state immediately
        const updatedList = wishlist.filter(
          (item: any) => item.pid !== product.pid
        );
        syncWishlist(updatedList);

        await axios.delete(
          `http://192.168.0.225:8082/api/wishlist/remove/${identifier}`,
          config
        );
      } else {
        // --- ADD LOGIC ---
        // Optimistic Update: Update Global UI state immediately
        syncWishlist([...wishlist, product]);

        await axios.post(
          `http://192.168.0.225:8082/api/wishlist/add`,
          { pid: product.pid },
          config
        );

        // Fetch to get the proper UUID from the database
        await fetchWishlistFromServer();
      }
    } catch (error: any) {
      console.error("Wishlist Error:", error.message);
      // Rollback UI on failure
      await fetchWishlistFromServer();
      Alert.alert("Error", "Could not update wishlist.");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className={`${isWeb ? "flex-row items-center p-5 bg-white border-b border-gray-100" : "flex-row items-center p-5 mt-8 bg-white border-b border-gray-100"}`}
      >
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
          key={isWeb ? "web-grid" : "mobile-grid"}
          columnWrapperStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => {
            // Check if this specific product's ID is in the global wishlist array
            const isFavourite = wishlist.some(
              (fav: any) => fav.pid === item.pid
            );

            return (
              <View
                className={`${isWeb ? "w-48" : "flex-1"} bg-white rounded-2xl p-3 m-2 border border-gray-100 shadow-sm`}
              >
                <Image
                  source={{
                    uri: item.imagePath || "https://via.placeholder.com/150",
                  }}
                  className="w-full h-24 mb-2"
                  resizeMode="contain"
                />
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-bold text-black">
                    ₹{item.price}
                  </Text>
                  <Text className="text-xs text-gray-400 line-through">
                    ₹{item.actualPrice}
                  </Text>
                </View>
                <Text
                  numberOfLines={2}
                  className="text-sm font-semibold text-gray-800 h-10 mt-1"
                >
                  {item.pname}
                </Text>

                <View className="flex-row justify-between items-center mt-2 mb-3">
                  <Text className="text-[10px] text-green-600 font-bold">
                    {item.discount}% OFF
                  </Text>
                  <Text className="text-xs font-bold">
                    ⭐ {item.rating || "4.5"}
                  </Text>
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
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

export default CategoryProducts;
