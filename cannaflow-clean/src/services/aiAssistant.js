import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { searchProducts } from './productService';
import { getTodayFloat, initializeDailyFloat, closeDailyFloat } from './cashFloatService';
import { getProducts } from './productService';
import { getDashboardAnalytics } from './analyticsService';
import { searchStrains, getStrainType } from '../data/strainDatabase';

// Intent types
const INTENT_TYPES = {
  ADD_TO_CART: 'add_to_cart',
  SHOW_INVENTORY: 'show_inventory',
  OPEN_FLOAT: 'open_float',
  CLOSE_FLOAT: 'close_float',
  SEARCH_PRODUCTS: 'search_products',
  ANALYTICS_QUERY: 'analytics_query',
  STRAIN_INFO: 'strain_info',
  UNKNOWN: 'unknown',
  ERROR: 'error'
};

// Regular expressions for parsing commands
const ADD_CART_REGEX = /\b(add|put|include)\b.+\b(to cart|to order|to basket)\b/i;
const QUANTITY_REGEX = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i;
const PRODUCT_TYPE_REGEX = /\b(sativa|indica|hybrid|flower|edible|concentrate|cbd|oil|gummies|pre-roll|vape)\b/i;
const INVENTORY_REGEX = /\b(show|display|list|view)\b.+\b(inventory|stock|products)\b/i;
const INVENTORY_FILTER_REGEX = /\b(for|of|with)\b.+\b(sativa|indica|hybrid|flower|edible|concentrate|cbd|oil|gummies|pre-roll|vape)\b/i;
const OPEN_FLOAT_REGEX = /\b(open|start|initialize|begin)\b.+\b(float|cash float|register|till)\b/i;
const CLOSE_FLOAT_REGEX = /\b(close|end|finalize)\b.+\b(float|cash float|register|till)\b/i;
const FLOAT_AMOUNT_REGEX = /\b(with|for|of|at)\b.+\$?([\d,.]+)\b/i;
const ANALYTICS_REGEX = /\b(what|show|tell|how many|how much|top|best|most)\b.+\b(sales|revenue|products|selling|customers|vendors|analytics)\b/i;
const STRAIN_INFO_REGEX = /\b(what|tell|info|information|about)\b.+\b(strain|type|is)\b/i;

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

/**
 * Parse a natural language command and determine the intent
 * @param {string} command - The natural language command
 * @param {string} businessType - The business type (retail or grow)
 * @returns {Object} The parsed command with intent and parameters
 */
export const parseCommand = async (command, businessType = 'retail') => {
  try {
    if (!command) return { type: INTENT_TYPES.UNKNOWN };
    
    // Convert command to lowercase for easier matching
    const lowerCommand = command.toLowerCase();
    
    // Check for analytics queries
    if (ANALYTICS_REGEX.test(lowerCommand)) {
      return await parseAnalyticsCommand(lowerCommand, command, businessType);
    }
    
    // Check for strain information queries
    if (STRAIN_INFO_REGEX.test(lowerCommand)) {
      return await parseStrainInfoCommand(lowerCommand, command);
    }
    
    // Check for add to cart intent
    if (ADD_CART_REGEX.test(lowerCommand)) {
      return await parseAddToCartCommand(lowerCommand, command);
    }
    
    // Check for show inventory intent
    if (INVENTORY_REGEX.test(lowerCommand)) {
      return await parseInventoryCommand(lowerCommand, command);
    }
    
    // Check for open float intent
    if (OPEN_FLOAT_REGEX.test(lowerCommand)) {
      return await parseOpenFloatCommand(lowerCommand, command);
    }
    
    // Check for close float intent
    if (CLOSE_FLOAT_REGEX.test(lowerCommand)) {
      return await parseCloseFloatCommand(lowerCommand, command);
    }
    
    // If no intent matches
    return {
      type: INTENT_TYPES.UNKNOWN,
      originalCommand: command
    };
  } catch (error) {
    console.error('Error parsing command:', error);
    return {
      type: INTENT_TYPES.ERROR,
      error,
      originalCommand: command
    };
  }
};

/**
 * Parse an analytics command
 */
const parseAnalyticsCommand = async (lowerCommand, originalCommand, businessType) => {
  try {
    // Determine the time period
    let period = 'today';
    if (lowerCommand.includes('week')) period = 'week';
    else if (lowerCommand.includes('month')) period = 'month';
    else if (lowerCommand.includes('year')) period = 'year';
    else if (lowerCommand.includes('all time')) period = 'all';
    
    // Get analytics data
    const analytics = await getDashboardAnalytics(period);
    
    // Determine what specific information is being requested
    let response = '';
    
    if (lowerCommand.includes('top') && lowerCommand.includes('product')) {
      const topProducts = analytics.topProducts.slice(0, 5);
      response = `Top selling products for ${period}: `;
      response += topProducts.map((p, i) => 
        `${i + 1}. ${p.name} (${p.quantitySold} units, $${p.revenue.toFixed(2)})`
      ).join(', ');
    } else if (lowerCommand.includes('revenue') || lowerCommand.includes('sales')) {
      response = `Total revenue for ${period}: $${analytics.sales.totalRevenue.toFixed(2)} from ${analytics.sales.totalSales} sales. Average order value: $${analytics.sales.averageOrderValue.toFixed(2)}`;
    } else if (lowerCommand.includes('inventory') || lowerCommand.includes('stock')) {
      response = `Inventory status: ${analytics.inventory.totalProducts} products, ${analytics.inventory.totalStock} units in stock, total value $${analytics.inventory.totalValue.toFixed(2)}. ${analytics.inventory.lowStockCount} items low on stock, ${analytics.inventory.outOfStockCount} out of stock.`;
    } else {
      // General summary
      response = `Analytics for ${period}: $${analytics.sales.totalRevenue.toFixed(2)} revenue from ${analytics.sales.totalSales} sales. Top product: ${analytics.topProducts[0]?.name || 'N/A'}. ${analytics.inventory.totalProducts} products in inventory.`;
    }
    
    return {
      type: INTENT_TYPES.ANALYTICS_QUERY,
      analytics,
      period,
      response,
      originalCommand
    };
  } catch (error) {
    console.error('Error parsing analytics command:', error);
    return {
      type: INTENT_TYPES.ERROR,
      error,
      originalCommand
    };
  }
};

/**
 * Parse a strain information command
 */
const parseStrainInfoCommand = async (lowerCommand, originalCommand) => {
  try {
    // Try to extract strain name
    const strainMatches = searchStrains(lowerCommand);
    
    if (strainMatches.length > 0) {
      const strain = strainMatches[0];
      const response = `${strain.name} is a ${strain.type} strain.`;
      
      return {
        type: INTENT_TYPES.STRAIN_INFO,
        strain,
        response,
        originalCommand
      };
    }
    
    return {
      type: INTENT_TYPES.UNKNOWN,
      message: 'Could not identify the strain you\'re asking about.',
      originalCommand
    };
  } catch (error) {
    console.error('Error parsing strain info command:', error);
    return {
      type: INTENT_TYPES.ERROR,
      error,
      originalCommand
    };
  }
};

/**
 * Parse an add to cart command
 */
const parseAddToCartCommand = async (lowerCommand, originalCommand) => {
  // Extract quantity
  let quantity = 1;
  const quantityMatch = lowerCommand.match(QUANTITY_REGEX);
  if (quantityMatch) {
    const quantityText = quantityMatch[1];
    quantity = WORD_TO_NUMBER[quantityText] || parseInt(quantityText, 10) || 1;
  }
  
  // First try to match strain names
  const strainMatches = searchStrains(lowerCommand);
  
  if (strainMatches.length > 0) {
    const strain = strainMatches[0];
    const products = await searchProducts(strain.name);
    
    if (products && products.length > 0) {
      return {
        type: INTENT_TYPES.ADD_TO_CART,
        product: products[0],
        quantity,
        strain,
        originalCommand
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
      return {
        type: INTENT_TYPES.ADD_TO_CART,
        product: products[0],
        quantity,
        originalCommand
      };
    }
  }
  
  // If we couldn't find a matching product
  return {
    type: INTENT_TYPES.SEARCH_PRODUCTS,
    query: productQuery || lowerCommand,
    originalCommand
  };
};

/**
 * Parse an inventory command
 */
const parseInventoryCommand = async (lowerCommand, originalCommand) => {
  // Check for filter criteria
  let filter = null;
  const filterMatch = lowerCommand.match(INVENTORY_FILTER_REGEX);
  
  if (filterMatch) {
    filter = filterMatch[2];
  }
  
  // Get products
  let products = await getProducts();
  
  // Apply filter if specified
  if (filter) {
    products = products.filter(p => 
      p.type.toLowerCase() === filter.toLowerCase() ||
      p.category.toLowerCase() === filter.toLowerCase()
    );
  }
  
  return {
    type: INTENT_TYPES.SHOW_INVENTORY,
    products,
    filter,
    originalCommand
  };
};

/**
 * Parse an open float command
 */
const parseOpenFloatCommand = async (lowerCommand, originalCommand) => {
  // Extract amount
  let amount = 200; // Default amount
  const amountMatch = lowerCommand.match(FLOAT_AMOUNT_REGEX);
  
  if (amountMatch) {
    amount = parseFloat(amountMatch[2].replace(/,/g, ''));
  }
  
  return {
    type: INTENT_TYPES.OPEN_FLOAT,
    amount,
    originalCommand
  };
};

/**
 * Parse a close float command
 */
const parseCloseFloatCommand = async (lowerCommand, originalCommand) => {
  // Extract amount
  let amount = null;
  const amountMatch = lowerCommand.match(FLOAT_AMOUNT_REGEX);
  
  if (amountMatch) {
    amount = parseFloat(amountMatch[2].replace(/,/g, ''));
  }
  
  return {
    type: INTENT_TYPES.CLOSE_FLOAT,
    amount,
    originalCommand
  };
};

/**
 * Execute a parsed command
 */
export const executeCommand = async (parsedCommand, context = {}) => {
  try {
    switch (parsedCommand.type) {
      case INTENT_TYPES.ADD_TO_CART:
        if (context.onAddToCart) {
          context.onAddToCart(parsedCommand.product, parsedCommand.quantity);
        }
        return {
          success: true,
          message: `Added ${parsedCommand.quantity} ${parsedCommand.product.name} to cart`,
          speak: true
        };
        
      case INTENT_TYPES.ANALYTICS_QUERY:
        return {
          success: true,
          message: parsedCommand.response,
          data: parsedCommand.analytics,
          speak: true
        };
        
      case INTENT_TYPES.STRAIN_INFO:
        return {
          success: true,
          message: parsedCommand.response,
          data: parsedCommand.strain,
          speak: true
        };
        
      case INTENT_TYPES.SHOW_INVENTORY:
        return {
          success: true,
          message: `Found ${parsedCommand.products.length} products${parsedCommand.filter ? ` matching ${parsedCommand.filter}` : ''}`,
          data: parsedCommand.products,
          speak: true
        };
        
      case INTENT_TYPES.OPEN_FLOAT:
        await initializeDailyFloat(parsedCommand.amount);
        return {
          success: true,
          message: `Cash float opened with $${parsedCommand.amount.toFixed(2)}`,
          speak: true
        };
        
      case INTENT_TYPES.CLOSE_FLOAT:
        if (parsedCommand.amount) {
          await closeDailyFloat(parsedCommand.amount);
          return {
            success: true,
            message: `Cash float closed with ending amount $${parsedCommand.amount.toFixed(2)}`,
            speak: true
          };
        } else {
          const floatData = await getTodayFloat();
          return {
            success: true,
            message: `Current float: Starting $${floatData.starting_amount}, Sales $${floatData.total_sales}`,
            data: floatData,
            speak: true
          };
        }
        
      case INTENT_TYPES.SEARCH_PRODUCTS:
        const products = await searchProducts(parsedCommand.query);
        return {
          success: products.length > 0,
          message: products.length > 0 
            ? `Found ${products.length} products matching "${parsedCommand.query}"`
            : `No products found matching "${parsedCommand.query}"`,
          data: products,
          speak: true
        };
        
      case INTENT_TYPES.UNKNOWN:
        return {
          success: false,
          message: 'I didn\'t understand that command. Try asking about sales, inventory, or products.',
          speak: true
        };
        
      default:
        return {
          success: false,
          message: 'Command not supported',
          speak: true
        };
    }
  } catch (error) {
    console.error('Error executing command:', error);
    return {
      success: false,
      message: 'Error executing command',
      error,
      speak: true
    };
  }
};

/**
 * Speak a response
 */
export const speak = (text) => {
  if (Platform.OS !== 'web') {
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9
    });
  }
};

/**
 * Process a natural language query
 */
export const processQuery = async (query, context = {}) => {
  try {
    const parsedCommand = await parseCommand(query, context.businessType);
    const result = await executeCommand(parsedCommand, context);
    
    if (result.speak && result.message) {
      speak(result.message);
    }
    
    return result;
  } catch (error) {
    console.error('Error processing query:', error);
    return {
      success: false,
      message: 'Error processing your request',
      error
    };
  }
};

export default {
  parseCommand,
  executeCommand,
  speak,
  processQuery,
  INTENT_TYPES
};