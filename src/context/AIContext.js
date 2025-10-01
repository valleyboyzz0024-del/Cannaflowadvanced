import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { processCommand, speakResponse } from '../services/aiAssistant';
import { 
  initComplianceEngine, 
  getComplianceSettings, 
  updateComplianceSettings,
  getUpcomingDeadlines,
  checkComplianceStatus
} from '../services/complianceEngine';

// Create context
const AIContext = createContext();

// AI Assistant settings storage key
const AI_SETTINGS_KEY = '@cannabis_pos_ai_settings';

// Default AI settings
const DEFAULT_AI_SETTINGS = {
  enabled: true,
  cloudEnabled: false,
  voiceEnabled: true,
  autoRespond: true,
  minimized: true,
  theme: 'green',
  fontSize: 'medium',
  showIntents: true,
  conversationHistory: true,
  maxHistoryItems: 50,
  contextAwareness: true
};

// AIProvider component
const AIProvider = ({ children }) => {
  // AI Assistant state
  const [aiSettings, setAISettings] = useState(DEFAULT_AI_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [contextData, setContextData] = useState({});
  
  // Compliance Engine state
  const [complianceSettings, setComplianceSettings] = useState(null);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [hasComplianceAlerts, setHasComplianceAlerts] = useState(false);
  
  // Initialize on component mount
  useEffect(() => {
    initializeAI();
    initializeCompliance();
  }, []);

  // Check for compliance alerts
  useEffect(() => {
    if (upcomingDeadlines && upcomingDeadlines.length > 0) {
      // Check if any deadlines are within the next 7 days
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const urgentDeadlines = upcomingDeadlines.filter(deadline => {
        const deadlineDate = new Date(deadline.date);
        return deadlineDate >= today && deadlineDate <= nextWeek;
      });
      
      setHasComplianceAlerts(urgentDeadlines.length > 0);
      
      // Show alert for urgent deadlines if enabled
      if (urgentDeadlines.length > 0 && complianceSettings?.notifyDays > 0) {
        const nextDeadline = urgentDeadlines[0];
        const daysUntil = Math.ceil((new Date(nextDeadline.date) - today) / (1000 * 60 * 60 * 24));
        
        Alert.alert(
          'Compliance Deadline Approaching',
          `${nextDeadline.description} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`,
          [
            { text: 'Dismiss', style: 'cancel' },
            { text: 'View Details', onPress: () => console.log('View compliance details') }
          ]
        );
      }
    }
  }, [upcomingDeadlines, complianceSettings]);

  // Initialize AI Assistant
  const initializeAI = async () => {
    try {
      // Load saved settings
      const savedSettings = await AsyncStorage.getItem(AI_SETTINGS_KEY);
      if (savedSettings) {
        setAISettings(JSON.parse(savedSettings));
      }
      
      // Load conversation history
      const savedHistory = await AsyncStorage.getItem('@cannabis_pos_conversation_history');
      if (savedHistory) {
        setConversationHistory(JSON.parse(savedHistory));
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing AI Assistant:', error);
      setIsInitialized(true); // Continue with defaults
    }
  };

  // Initialize Compliance Engine
  const initializeCompliance = async () => {
    try {
      // Initialize compliance engine
      const settings = await initComplianceEngine();
      setComplianceSettings(settings);
      
      // Get compliance status
      const status = await checkComplianceStatus();
      setComplianceStatus(status);
      
      // Get upcoming deadlines
      const deadlines = await getUpcomingDeadlines(30); // Next 30 days
      setUpcomingDeadlines(deadlines);
    } catch (error) {
      console.error('Error initializing Compliance Engine:', error);
    }
  };

  // Update AI settings
  const updateAISettings = async (newSettings) => {
    try {
      const updatedSettings = { ...aiSettings, ...newSettings };
      setAISettings(updatedSettings);
      await AsyncStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error updating AI settings:', error);
    }
  };

  // Process command with context awareness
  const processCommandWithContext = async (command) => {
    try {
      // Add context data to enhance command processing
      const result = await processCommand(command, contextData);
      
      // Update conversation history
      if (aiSettings.conversationHistory) {
        const newHistoryItem = {
          id: Date.now().toString(),
          command,
          response: result.response,
          timestamp: new Date().toISOString(),
          intent: result.type
        };
        
        const updatedHistory = [
          ...conversationHistory, 
          newHistoryItem
        ].slice(-aiSettings.maxHistoryItems);
        
        setConversationHistory(updatedHistory);
        await AsyncStorage.setItem('@cannabis_pos_conversation_history', JSON.stringify(updatedHistory));
      }
      
      // Update context data based on the result
      if (aiSettings.contextAwareness) {
        const newContextData = { ...contextData };
        
        // Update context based on intent
        switch (result.type) {
          case 'add_to_cart':
            newContextData.lastProduct = result.parsedCommand.productName || result.parsedCommand.productType;
            newContextData.lastAction = 'add_to_cart';
            break;
          case 'show_inventory':
            newContextData.lastCategory = result.parsedCommand.filter;
            newContextData.lastAction = 'show_inventory';
            break;
          case 'open_float':
            newContextData.floatOpen = true;
            newContextData.floatAmount = result.parsedCommand.amount;
            newContextData.lastAction = 'open_float';
            break;
          case 'close_float':
            newContextData.floatOpen = false;
            newContextData.lastAction = 'close_float';
            break;
          default:
            newContextData.lastAction = result.type;
        }
        
        setContextData(newContextData);
      }
      
      return result;
    } catch (error) {
      console.error('Error processing command with context:', error);
      throw error;
    }
  };

  // Clear conversation history
  const clearConversationHistory = async () => {
    try {
      setConversationHistory([]);
      await AsyncStorage.removeItem('@cannabis_pos_conversation_history');
    } catch (error) {
      console.error('Error clearing conversation history:', error);
    }
  };

  // Update compliance settings
  const updateComplianceSettingsWithRefresh = async (newSettings) => {
    try {
      const updatedSettings = await updateComplianceSettings(newSettings);
      setComplianceSettings(updatedSettings);
      
      // Refresh compliance status and deadlines
      const status = await checkComplianceStatus();
      setComplianceStatus(status);
      
      const deadlines = await getUpcomingDeadlines(30);
      setUpcomingDeadlines(deadlines);
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating compliance settings:', error);
      throw error;
    }
  };

  // Refresh compliance data
  const refreshComplianceData = async () => {
    try {
      const status = await checkComplianceStatus();
      setComplianceStatus(status);
      
      const deadlines = await getUpcomingDeadlines(30);
      setUpcomingDeadlines(deadlines);
      
      return { status, deadlines };
    } catch (error) {
      console.error('Error refreshing compliance data:', error);
      throw error;
    }
  };

  // Context value
  const contextValue = {
    // AI Assistant
    aiSettings,
    isInitialized,
    conversationHistory,
    contextData,
    updateAISettings,
    processCommandWithContext,
    clearConversationHistory,
    
    // Compliance Engine
    complianceSettings,
    complianceStatus,
    upcomingDeadlines,
    hasComplianceAlerts,
    updateComplianceSettings: updateComplianceSettingsWithRefresh,
    refreshComplianceData
  };

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
};

// Custom hook for using the AI context
const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export { AIContext, AIProvider, useAI };