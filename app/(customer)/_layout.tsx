import { Tabs } from 'expo-router';
import React from 'react';

const Customerlayout = () => {
  return (
   <Tabs>
                <Tabs.Screen name='home'     options={{headerShown:false}} />
                <Tabs.Screen name='wishlist'     options={{headerShown:false}} />
                <Tabs.Screen name='cart'     options={{headerShown:false}} />
                <Tabs.Screen name='profile'     options={{headerShown:false}} />
   </Tabs>
  )
}

export default Customerlayout;