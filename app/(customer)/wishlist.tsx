// // import React from 'react'
// // import { Text, View } from 'react-native'

// // const wishlist = () => {
// //   return (
// //     <View>
// //       <Text>wishlist</Text>
// //     </View>
// //   )
// // }

// // export default wishlist
// import { FontAwesome5 } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import React, { useEffect, useState } from "react";
// import { View, Text, FlatList, Image, TouchableOpacity, Platform } from "react-native";
// import { useFocusEffect } from 'expo-router';
// import { router } from "expo-router";
// export default function WishlistScreen() {
//   const [wishlist, setWishlist] = useState<any[] | null>(null); // Initial state is null
//   const isWeb = Platform.OS === "web";

//   useFocusEffect(
//     React.useCallback(() => {
//       const loadData = async () => {
//         const stored = await AsyncStorage.getItem("user_wishlist");
//         setWishlist(stored ? JSON.parse(stored) : []);
//       };
//       loadData();
//     }, [])
//   );
// const loadWishlist = async () => {
//   try {
//     const stored = await AsyncStorage.getItem("user_wishlist");
//     if (stored) {
//       const parsed = JSON.parse(stored);
//       // Only keep actual objects that have a pid
//       const cleanedData = parsed.filter((item: any) => item !== null && item?.pid);
//       setWishlist(cleanedData);
//     } else {
//       setWishlist([]);
//     }
//   } catch (error) {
//     console.error(error);
//   }
// };
//   const remove = async (pid: number) => {
//     if (!wishlist) return;
//     const updated = wishlist.filter(item => item.pid !== pid);
//     setWishlist(updated);
//     await AsyncStorage.setItem("user_wishlist", JSON.stringify(updated));
//   };
// // const remove = async (pid: number) => {
// //   try {
// //     await axios.delete(`http://192.168.0.186:8080/api/wishlist/remove/${pid}`);

// //     setWishlist(prev => prev ? prev.filter(item => item.pid !== pid) : []);
// //   } catch (error) {
// //     console.error("Delete error:", error);
// //   }
// // };

//   if (!wishlist || wishlist.length === 0) {
//     return (
//       <View className="flex-1 bg-white items-center justify-center p-6">
//         <View className="bg-pink-50 p-5 rounded-full mb-6">
//           <FontAwesome5 name="heart" size={40} color="#ff3385" opacity={0.2} />
//         </View>
//         <Text className="text-2xl font-bold text-gray-800">No items added</Text>
//         <Text className="text-gray-500 text-center mt-2">
//           Your wishlist is currently empty. Start adding your favorite products!
//         </Text>
//         <TouchableOpacity
//           className="mt-8 bg-[#590080] px-8 py-4 rounded-2xl"
//           onPress={() => router.push("/(customer)/home")}
//         >
//           <Text className="text-white font-bold text-lg">Go Shopping</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1 bg-gray-50 p-4 ">
//       <View className="rounded-full flex-row ">
//           <FontAwesome5 name="heart" size={27} color="#ff3385"  />
//           <Text className="text-2xl font-bold italic mb-8 text-gray-800"> My Wishlist ({wishlist.length})</Text>
//         </View>
//       <FlatList
//         data={wishlist}
//         keyExtractor={(item) => item.pid.toString()}
//         renderItem={({ item }) => (
//           <View className="bg-white m-2 p-5 pl-8 rounded-3xl mb-4 flex-row items-center shadow-lg">
//             <Image source={{ uri: item.imagePath }} className="w-20 h-20 rounded-xl" />
//             <View className="flex-1 ml-4 ">
//               <Text className="font-bold text-gray-800 m-2 text-xl">{item.pname}</Text>
//               <View className="flex-row m-1 ">

//               <Text className="text-[#590080] font-black text-lg mr-2">₹{item.price} </Text>
//               <Text className="text-[10px] text-green-600 font-bold  mt-2">{item.discount}% OFF</Text>
//             </View>

//         <Text className="text-xs font-semibold m-2">Rating : ⭐ {item.rating || '4.5'}</Text>
//             </View>

//             <TouchableOpacity onPress={() => remove(item.pid)} >
//               <View className="flex-row bg-[#ff3385] border-0  py-2 px-2 rounded-xl mr-10">

//                 <Text className="text-[#fff] text-[18px] font-semibold mr-2">Remove</Text>
//                 <FontAwesome5 name="trash" size={18} color="#fff" className="mt-1" />
//               </View>
//             </TouchableOpacity>
//           </View>
//         )}
//       />
//     </View>
//   );
// }

import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

export default function WishlistScreen() {
  const [wishlist, setWishlist] = useState<any[] | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const loadWishlist = async () => {
        try {
          const stored = await AsyncStorage.getItem("user_wishlist");
          if (stored) {
            const parsed = JSON.parse(stored);

            const cleanedData = parsed.filter(
              (item: any) => item !== null && item?.pid
            );
            setWishlist(cleanedData);
          } else {
            setWishlist([]);
          }
        } catch (error) {
          console.error("Error loading wishlist:", error);
        }
      };
      loadWishlist();
    }, [])
  );

  const remove = async (pid: number) => {
    if (!wishlist) return;

    const updated = wishlist.filter((item) => item.pid !== pid);

    setWishlist(updated);

    await AsyncStorage.setItem("user_wishlist", JSON.stringify(updated));
  };

  if (!wishlist || wishlist.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <View className="bg-pink-50 p-5 rounded-full mb-6">
          <FontAwesome5 name="heart" size={50} color="#ff3385" opacity={0.2} />
        </View>
        <Text className="text-2xl font-bold text-gray-800">No items added</Text>
        <Text className="text-gray-500 text-center mt-2">
          Your wishlist is currently empty.
        </Text>
        <TouchableOpacity
          className="mt-8 bg-[#590080] px-8 py-4 rounded-2xl"
          onPress={() => router.push("/(customer)/home")}
        >
          <Text className="text-white font-bold text-lg">Go Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="flex-row items-center mb-6">
        <FontAwesome5 name="heart" size={24} color="#ff3385" solid />
        <Text className="text-2xl font-bold italic ml-2 text-gray-800">
          My Wishlist ({wishlist.length})
        </Text>
      </View>

      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.pid.toString()}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-3xl m-4 flex-row items-center shadow-md">
            <Image
              source={{ uri: item.imagePath }}
              className="w-20 h-20 rounded-xl"
              resizeMode="contain"
            />
            <View className="flex-1 ml-4">
              <Text className="font-bold text-gray-800 text-lg">
                {item.pname}
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-[#590080] font-black text-lg mr-2">
                  ₹{item.price}
                </Text>
                <Text className="text-xs text-green-600 font-bold">
                  {item.discount}% OFF
                </Text>
              </View>
              <Text className="text-xs text-gray-500 mt-1">
                ⭐ {item.rating || "4.5"}
              </Text>
            </View>

            <TouchableOpacity onPress={() => remove(item.pid)}>
              <View className="bg-red-50 p-3 rounded-2xl flex-row border border-[#ff3385]">
                <Text className="text-[#ff3385] font-semibold mr-2">
                  Remove
                </Text>
                <FontAwesome5 name="trash" size={16} color="#ff3385" />
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
