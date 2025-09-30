import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import BusinessTypeSelectionScreen from '../screens/BusinessTypeSelectionScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GrowDashboardScreen from '../screens/GrowDashboardScreen';
import SalesScreen from '../screens/SalesScreen';
import CartScreen from '../screens/CartScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SaleDetailScreen from '../screens/SaleDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CashFloatScreen from '../screens/CashFloatScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ComplianceDashboard from '../components/ComplianceDashboard';

import { theme } from '../theme/theme';
import AIFloatingButton from '../components/AIFloatingButton';
import { useAI } from '../context/AIContext';
import { useCart } from '../context/CartContext';
import { useBusinessType, BUSINESS_TYPES } from '../context/BusinessTypeContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Sales Stack Navigator
const SalesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SalesMain" component={SalesScreen} />
    <Stack.Screen name="Cart" component={CartScreen} />
    <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
  </Stack.Navigator>
);

// Inventory Stack Navigator
const InventoryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="InventoryMain" component={InventoryScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
  </Stack.Navigator>
);

// Settings Stack Navigator
const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    <Stack.Screen name="CashFloat" component={CashFloatScreen} />
  </Stack.Navigator>
);

// Analytics Stack Navigator
const AnalyticsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AnalyticsMain" component={AnalyticsScreen} />
  </Stack.Navigator>
);

// Compliance Stack Navigator
const ComplianceStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ComplianceMain" component={ComplianceDashboard} />
  </Stack.Navigator>
);

// Retail Mode Tabs
const RetailTabs = () => {
  const { addToCart } = useCart();

  const handleAddToCart = (product, quantity) => {
    addToCart(product, quantity);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.disabled,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 0,
            elevation: 8,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          }
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="Sales" 
          component={SalesStack} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cash-register" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="Analytics" 
          component={AnalyticsStack} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chart-line" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="Inventory" 
          component={InventoryStack} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="package-variant-closed" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsStack} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
      
      <AIFloatingButton onAddToCart={handleAddToCart} />
    </View>
  );
};

// Grow Mode Tabs
const GrowTabs = () => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.disabled,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 0,
            elevation: 8,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          }
        }}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={GrowDashboardScreen} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="sprout" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="Analytics" 
          component={AnalyticsStack} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chart-line" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="Inventory" 
          component={InventoryStack} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="package-variant-closed" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="Compliance" 
          component={ComplianceStack} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="clipboard-check" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsStack} 
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
      
      <AIFloatingButton />
    </View>
  );
};

// Main Tabs - Conditional based on business type
const MainTabs = () => {
  const { businessType, isRetail, isGrow } = useBusinessType();

  if (isRetail) {
    return <RetailTabs />;
  } else if (isGrow) {
    return <GrowTabs />;
  }

  // Fallback to retail if no business type is set
  return <RetailTabs />;
};

// Main App Navigator
const AppNavigator = () => {
  const { businessType } = useBusinessType();

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.notification,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!businessType ? (
          <Stack.Screen name="BusinessTypeSelection" component={BusinessTypeSelectionScreen} />
        ) : null}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;