import { Tabs } from 'expo-router';
import React from 'react';

const AdminLayout = () => {
  return (
    <Tabs>
            <Tabs.Screen   name='Admindashboard' options={{headerShown:false}}  />    
            <Tabs.Screen   name='Customizations' options={{headerShown:false}}  />    
    </Tabs>
  )
}

export default AdminLayout;