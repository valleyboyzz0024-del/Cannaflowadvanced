import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BusinessTypeContext = createContext();

export const BUSINESS_TYPES = {
  RETAIL: 'retail',
  GROW: 'grow'
};

export const useBusinessType = () => useContext(BusinessTypeContext);

export const BusinessTypeProvider = ({ children }) => {
  const [businessType, setBusinessType] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load business type on app start
  useEffect(() => {
    loadBusinessType();
  }, []);

  const loadBusinessType = async () => {
    try {
      const savedType = await AsyncStorage.getItem('@business_type');
      if (savedType) {
        setBusinessType(savedType);
      }
    } catch (error) {
      console.error('Error loading business type:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessType = async (type) => {
    try {
      await AsyncStorage.setItem('@business_type', type);
      setBusinessType(type);
      return true;
    } catch (error) {
      console.error('Error saving business type:', error);
      return false;
    }
  };

  const clearBusinessType = async () => {
    try {
      await AsyncStorage.removeItem('@business_type');
      setBusinessType(null);
      return true;
    } catch (error) {
      console.error('Error clearing business type:', error);
      return false;
    }
  };

  const isRetail = businessType === BUSINESS_TYPES.RETAIL;
  const isGrow = businessType === BUSINESS_TYPES.GROW;

  const value = {
    businessType,
    setBusinessType: saveBusinessType,
    clearBusinessType,
    isRetail,
    isGrow,
    loading,
    BUSINESS_TYPES
  };

  return (
    <BusinessTypeContext.Provider value={value}>
      {children}
    </BusinessTypeContext.Provider>
  );
};

export default BusinessTypeContext;