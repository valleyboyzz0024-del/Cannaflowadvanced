import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Text,
  Modal,
  Dimensions,
  Platform,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { AIContext } from '../context/AIContext';
import AIAssistant from './AIAssistant';
import ComplianceDashboard from './ComplianceDashboard';

const { width, height } = Dimensions.get('window');

const AIFloatingButton = () => {
  const theme = useTheme();
  const { aiSettings, updateAISettings } = useContext(AIContext);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showComplianceDashboard, setShowComplianceDashboard] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Set up keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    
    // Start pulse animation
    startPulseAnimation();
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Pulse animation for the button
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  };
  
  // Toggle the menu
  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    
    Animated.spring(menuAnimation, {
      toValue,
      friction: 6,
      useNativeDriver: true
    }).start();
    
    Animated.spring(buttonAnimation, {
      toValue,
      friction: 6,
      useNativeDriver: true
    }).start();
    
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Open AI Assistant
  const openAIAssistant = () => {
    setShowAIAssistant(true);
    toggleMenu();
  };
  
  // Open Compliance Dashboard
  const openComplianceDashboard = () => {
    setShowComplianceDashboard(true);
    toggleMenu();
  };
  
  // Toggle AI Assistant enabled/disabled
  const toggleAIEnabled = () => {
    updateAISettings({ enabled: !aiSettings.enabled });
    toggleMenu();
  };
  
  // Calculate menu item positions
  const getMenuItemStyle = (index) => {
    const translateY = menuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -60 * (index + 1)]
    });
    
    const opacity = menuAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1]
    });
    
    const scale = menuAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1]
    });
    
    return {
      transform: [{ translateY }, { scale }],
      opacity
    };
  };
  
  // Button rotation animation
  const buttonRotation = buttonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });
  
  // Don't show the button when keyboard is visible
  if (keyboardVisible) {
    return null;
  }
  
  return (
    <>
      <View style={styles.container}>
        {/* Menu Items */}
        <Animated.View style={[styles.menuItem, getMenuItemStyle(2)]}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: '#8BC34A' }]}
            onPress={toggleAIEnabled}
          >
            <Ionicons
              name={aiSettings.enabled ? 'power' : 'power-outline'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <View style={styles.menuLabel}>
            <Text style={styles.menuLabelText}>
              {aiSettings.enabled ? 'Disable AI' : 'Enable AI'}
            </Text>
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.menuItem, getMenuItemStyle(1)]}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: '#00796B' }]}
            onPress={openComplianceDashboard}
          >
            <Ionicons name="document-text" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.menuLabel}>
            <Text style={styles.menuLabelText}>Compliance</Text>
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.menuItem, getMenuItemStyle(0)]}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: '#2E7D32' }]}
            onPress={openAIAssistant}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.menuLabel}>
            <Text style={styles.menuLabelText}>AI Assistant</Text>
          </View>
        </Animated.View>
        
        {/* Main Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [
                { rotate: buttonRotation },
                { scale: pulseAnimation }
              ]
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={toggleMenu}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* AI Assistant Modal */}
      <Modal
        visible={showAIAssistant}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAIAssistant(false)}
      >
        <View style={styles.modalContainer}>
          <AIAssistant onClose={() => setShowAIAssistant(false)} />
        </View>
      </Modal>
      
      {/* Compliance Dashboard Modal */}
      <Modal
        visible={showComplianceDashboard}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComplianceDashboard(false)}
      >
        <View style={styles.modalContainer}>
          <ComplianceDashboard onClose={() => setShowComplianceDashboard(false)} />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    alignItems: 'center',
    zIndex: 999
  },
  buttonContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5
  },
  button: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3
  },
  menuLabel: {
    position: 'absolute',
    right: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  menuLabelText: {
    color: 'white',
    fontSize: 12
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white'
  }
});

export default AIFloatingButton;