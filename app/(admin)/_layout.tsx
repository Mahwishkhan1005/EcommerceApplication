import { Tabs } from 'expo-router';
import React from 'react';

const AdminLayout = () => {
  return (
    <Tabs>
            <Tabs.Screen   name='Admindashboard' />    
            <Tabs.Screen   name='Customizations' />    
    </Tabs>
  )
}

export default AdminLayout;