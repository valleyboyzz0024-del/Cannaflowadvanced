import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ComplianceModeContext = createContext();

export const useComplianceMode = () => useContext(ComplianceModeContext);

export const ComplianceModeProvider = ({ children }) => {
  const [complianceMode, setComplianceModeState] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load compliance mode on app start
  useEffect(() => {
    loadComplianceMode();
  }, []);

  const loadComplianceMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('@compliance_mode');
      if (savedMode !== null) {
        setComplianceModeState(savedMode === 'true');
      }
    } catch (error) {
      console.error('Error loading compliance mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const setComplianceMode = async (enabled) => {
    try {
      await AsyncStorage.setItem('@compliance_mode', enabled.toString());
      setComplianceModeState(enabled);
      return true;
    } catch (error) {
      console.error('Error saving compliance mode:', error);
      return false;
    }
  };

  const toggleComplianceMode = async () => {
    const newMode = !complianceMode;
    await setComplianceMode(newMode);
    return newMode;
  };

  const value = {
    complianceMode,
    setComplianceMode,
    toggleComplianceMode,
    loading
  };

  return (
    <ComplianceModeContext.Provider value={value}>
      {children}
    </ComplianceModeContext.Provider>
  );
};

export default ComplianceModeContext;