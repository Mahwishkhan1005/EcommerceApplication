// import React, { createContext, ReactNode, useContext, useState } from "react";

// interface StoreContextType {
//   wishlist: any[];
//   cart: any[];
//   // 1. Added syncWishlist to the interface
//   syncWishlist: (items: any[]) => void;
//   addToWishlist: (item: any) => void;
//   addToCart: (item: any) => void;
//   removeFromWishlist: (id: string | number) => void;
// }

// const StoreContext = createContext<StoreContextType | undefined>(undefined);

// export const StoreProvider = ({ children }: { children: ReactNode }) => {
//   const [wishlist, setWishlist] = useState<any[]>([]);
//   const [cart, setCart] = useState<any[]>([]);

//   // Use this to update the count from your API
//   const syncWishlist = (items: any[]) => {
//     setWishlist(items);
//   };

//   const addToWishlist = (item: any) => {
//     setWishlist((prev) => [...prev, item]);
//   };

//   const addToCart = (item: any) => {
//     setCart((prev) => [...prev, item]);
//   };

//   const removeFromWishlist = (id: string | number) => {
//     // Handling both string and number IDs
//     setWishlist((prev) => prev.filter((item) => (item.id || item.pid) !== id));
//   };

//   return (
//     <StoreContext.Provider
//       // 2. Added syncWishlist to the value so other screens can use it
//       value={{
//         wishlist,
//         cart,
//         syncWishlist,
//         addToWishlist,
//         addToCart,
//         removeFromWishlist,
//       }}
//     >
//       {children}
//     </StoreContext.Provider>
//   );
// };

// export const useStore = () => {
//   const context = useContext(StoreContext);
//   if (!context) throw new Error("useStore must be used within a StoreProvider");
//   return context;
// };

import React, { createContext, ReactNode, useContext, useState } from "react";

interface StoreContextType {
  wishlist: any[];
  cart: any[];

  wishlistCount: number;
  cartCount: number;

  syncWishlist: (items: any[]) => void;
  addToWishlist: (item: any) => void;
  removeFromWishlist: (itemId: string | number) => void;

  addToCart: (item: any) => void;
  removeFromCart: (pid: number) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  const syncWishlist = (items: any[]) => {
    setWishlist(items);
  };

  const addToWishlist = (item: any) => {
    setWishlist((prev) => [...prev, item]);
  };

  const removeFromWishlist = (itemId: string | number) => {
    setWishlist((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const addToCart = (item: any) => {
    setCart((prev) => [...prev, item]);
  };

  const removeFromCart = (pid: number) => {
    setCart((prev) => prev.filter((item) => item.pid !== pid));
  };

  return (
    <StoreContext.Provider
      value={{
        wishlist,
        cart,

        wishlistCount: wishlist.length,
        cartCount: cart.length,

        syncWishlist,
        addToWishlist,
        removeFromWishlist,

        addToCart,
        removeFromCart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
