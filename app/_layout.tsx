import { Stack } from "expo-router";
import './globals.css';

export default function RootLayout() {
  return  (
    <Stack>
      <Stack.Screen name="index" option={{headerShown:false}}/>
      <Stack.Screen   name="(admin)"  options={{headerShown:false}} />
      <Stack.Screen   name="(customer)"   options={{headerShown:false}}  />
      <Stack.Screen   name="categoryproducts"   options={{headerShown:false}}  />
      
    </Stack>
  )
}
