import * as Speech from 'expo-speech';
import { searchProducts } from './productService';
import { Platform } from 'react-native';
import { searchStrains, getStrainType, STRAIN_TYPES } from '../data/strainDatabase';

// Regular expressions for parsing voice commands
const QUANTITY_REGEX = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i;
const PRODUCT_TYPE_REGEX = /\b(sativa|indica|hybrid|flower|edible|concentrate|cbd|oil|gummies|pre-roll|vape)\b/i;

// Map word numbers to digits
const WORD_TO_NUMBER = {
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10
};

export const startVoiceRecognition = async (onResult, onError) => {
  try {
    // This is a placeholder since Expo doesn't have built-in voice recognition
    // In a real app, you would use a library like react-native-voice
    
    // For mobile, we'll use a different approach than web
    if (Platform.OS === 'web') {
      // Web simulation
      Speech.speak('Listening for commands...', {
        language: 'en',
        pitch: 1.0,
        rate: 0.9
      });
      
      // Simulate voice recognition result after 2 seconds
      setTimeout(() => {
        onResult('Add two grams of blue dream');
      }, 2000);
    } else {
      // On mobile, we'll use a more realistic approach
      // In a real app, you would integrate with react-native-voice
      // For now, we'll show a message and simulate a response
      Speech.speak('Listening for commands. Try saying "Add two grams of Blue Dream"', {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          // After speaking the prompt, simulate receiving a command
          setTimeout(() => {
            onResult('Add two grams of blue dream');
          }, 3000);
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    if (onError) onError(error);
    return false;
  }
};

export const stopVoiceRecognition = () => {
  // This is a placeholder since Expo doesn't have built-in voice recognition
  // In a real app, you would use a library like react-native-voice
  
  Speech.speak('Voice recognition stopped', {
    language: 'en',
    pitch: 1.0,
    rate: 0.9
  });
  
  return true;
};

// Enhanced strain recognition
export const recognizeStrain = (text) => {
  const normalizedText = text.toLowerCase().trim();
  const matches = searchStrains(normalizedText);
  
  if (matches.length > 0) {
    return {
      found: true,
      strain: matches[0],
      allMatches: matches
    };
  }
  
  return {
    found: false,
    strain: null,
    allMatches: []
  };
};

export const parseVoiceCommand = async (command) => {
  try {
    if (!command) return null;
    
    // Convert command to lowercase for easier matching
    const lowerCommand = command.toLowerCase();
    
    // Check if this is an add to cart command
    if (!lowerCommand.includes('add')) {
      return {
        type: 'unknown',
        originalCommand: command
      };
    }
    
    // Extract quantity
    let quantity = 1;
    const quantityMatch = lowerCommand.match(QUANTITY_REGEX);
    if (quantityMatch) {
      const quantityText = quantityMatch[1];
      quantity = WORD_TO_NUMBER[quantityText] || parseInt(quantityText, 10) || 1;
    }
    
    // First try to match strain names from our comprehensive database
    const strainResult = recognizeStrain(lowerCommand);
    
    if (strainResult.found) {
      // Search for products matching this strain
      const products = await searchProducts(strainResult.strain.name);
      
      if (products && products.length > 0) {
        const product = products[0];
        
        return {
          type: 'add_to_cart',
          product,
          quantity,
          strain: strainResult.strain,
          originalCommand: command
        };
      }
    }
    
    // Fallback to product type matching
    const typeMatch = lowerCommand.match(PRODUCT_TYPE_REGEX);
    let productQuery = '';
    
    if (typeMatch) {
      productQuery = typeMatch[1];
      const products = await searchProducts(productQuery);
      
      if (products && products.length > 0) {
        const product = products[0];
        
        return {
          type: 'add_to_cart',
          product,
          quantity,
          originalCommand: command
        };
      }
    }
    
    // If we couldn't find a matching product
    return {
      type: 'product_not_found',
      query: strainResult.found ? strainResult.strain.name : (productQuery || command),
      suggestions: strainResult.allMatches.slice(0, 5),
      originalCommand: command
    };
  } catch (error) {
    console.error('Error parsing voice command:', error);
    return {
      type: 'error',
      error,
      originalCommand: command
    };
  }
};

export const speakResponse = (text) => {
  Speech.speak(text, {
    language: 'en',
    pitch: 1.0,
    rate: 0.9
  });
};

export const handleVoiceCommand = async (command, onAddToCart) => {
  try {
    const result = await parseVoiceCommand(command);
    
    switch (result.type) {
      case 'add_to_cart':
        const strainInfo = result.strain ? ` - a ${result.strain.type} strain` : '';
        speakResponse(`Adding ${result.quantity} ${result.product.name}${strainInfo} to cart`);
        if (onAddToCart) {
          onAddToCart(result.product, result.quantity);
        }
        return {
          success: true,
          message: `Added ${result.quantity} ${result.product.name} to cart`,
          result
        };
        
      case 'product_not_found':
        const suggestions = result.suggestions && result.suggestions.length > 0
          ? ` Did you mean ${result.suggestions[0].name}?`
          : '';
        speakResponse(`Sorry, I couldn't find a product matching ${result.query}.${suggestions}`);
        return {
          success: false,
          message: `Couldn't find a product matching "${result.query}"`,
          result
        };
        
      case 'unknown':
        speakResponse('Sorry, I didn\'t understand that command. Try saying "Add two grams of Blue Dream"');
        return {
          success: false,
          message: 'Command not recognized',
          result
        };
        
      case 'error':
        speakResponse('Sorry, there was an error processing your command');
        return {
          success: false,
          message: 'Error processing command',
          result
        };
        
      default:
        speakResponse('Sorry, I couldn\'t process that command');
        return {
          success: false,
          message: 'Unknown result type',
          result
        };
    }
  } catch (error) {
    console.error('Error handling voice command:', error);
    speakResponse('Sorry, there was an error processing your command');
    return {
      success: false,
      message: 'Error handling command',
      error
    };
  }
};

// New function for mobile voice integration
export const isMobileVoiceSupported = () => {
  // In a real app, you would check if the device supports voice recognition
  // For now, we'll return true for mobile platforms and false for web
  return Platform.OS !== 'web';
};

// New function to get voice permissions on mobile
export const requestVoicePermissions = async () => {
  // In a real app, you would request microphone permissions
  // For now, we'll just return true
  return true;
};

// Get strain information
export const getStrainInfo = (strainName) => {
  const type = getStrainType(strainName);
  if (type) {
    return {
      name: strainName,
      type,
      description: `${strainName} is a ${type} strain`
    };
  }
  return null;
};

// Parse inventory command with strain recognition
export const parseInventoryCommand = (text) => {
  const normalizedText = text.toLowerCase().trim();
  
  // Check for strain name
  const strainResult = recognizeStrain(normalizedText);
  
  // Extract quantity if present
  const quantityMatch = normalizedText.match(/(\d+)\s*(gram|grams|g|ounce|ounces|oz|unit|units)?/i);
  const quantity = quantityMatch ? parseInt(quantityMatch[1]) : null;
  
  // Extract price if present
  const priceMatch = normalizedText.match(/\$?(\d+\.?\d*)/);
  const price = priceMatch ? parseFloat(priceMatch[1]) : null;
  
  return {
    strain: strainResult.found ? strainResult.strain : null,
    quantity,
    price,
    rawText: text,
    suggestions: strainResult.allMatches.slice(0, 5)
  };
};