import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

const AdminLayout = () => {
  return (
    <Tabs 
      screenOptions={{ 
        // Sets the active tab color to match your brand purple
        tabBarActiveTintColor: '#8b008b',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tabs.Screen 
        name='Admindashboard' 
        options={{
          headerShown: false,
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }} 
      />    
      <Tabs.Screen 
        name='Customizations' 
        options={{
          headerShown: false,
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }} 
      />  
      <Tabs.Screen
      name ='coupons'
      options={{
        headerShown: false,
        tabBarLabel:'Coupons',
        tabBarIcon: ({color,size}) => (
          <Ionicons name='ticket' size={size} color={color}/>
        ),
      }}
      />  
    </Tabs>
  );
}

export default AdminLayout;