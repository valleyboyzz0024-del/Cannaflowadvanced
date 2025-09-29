import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { searchProducts } from './productService';
import { getTodayFloat, initializeDailyFloat, closeDailyFloat } from './cashFloatService';
import { getProducts } from './productService';

// Intent types
const INTENT_TYPES = {
  ADD_TO_CART: 'add_to_cart',
  SHOW_INVENTORY: 'show_inventory',
  OPEN_FLOAT: 'open_float',
  CLOSE_FLOAT: 'close_float',
  SEARCH_PRODUCTS: 'search_products',
  APPLY_DISCOUNT: 'apply_discount',
  VOID_ITEM: 'void_item',
  COMPLETE_SALE: 'complete_sale',
  RETURN_ITEM: 'return_item',
  CHECK_PRICE: 'check_price',
  VIEW_REPORTS: 'view_reports',
  HELP: 'help',
  UNKNOWN: 'unknown',
  ERROR: 'error'
};

// Cannabis-specific terminology
const CANNABIS_TERMS = {
  STRAINS: [
    'blue dream', 'og kush', 'sour diesel', 'girl scout cookies', 'purple punch', 
    'jack herer', 'northern lights', 'pineapple express', 'white widow', 'granddaddy purple',
    'ak-47', 'bubba kush', 'durban poison', 'green crack', 'wedding cake', 
    'gorilla glue', 'skywalker og', 'super lemon haze', 'trainwreck', 'gelato',
    'bruce banner', 'strawberry cough', 'chemdawg', 'platinum cookies', 'critical mass',
    'blueberry', 'afghan kush', 'purple haze', 'maui wowie', 'acapulco gold'
  ],
  CATEGORIES: [
    'sativa', 'indica', 'hybrid', 'flower', 'edible', 'concentrate', 'cbd', 
    'oil', 'gummies', 'pre-roll', 'vape', 'tincture', 'topical', 'capsule', 
    'beverage', 'hash', 'shatter', 'wax', 'budder', 'live resin', 'rosin',
    'cartridge', 'disposable', 'seeds', 'clone', 'accessories'
  ],
  CONSUMPTION_METHODS: [
    'smoke', 'vape', 'dab', 'eat', 'drink', 'sublingual', 'topical', 'oral',
    'inhalation', 'ingestion', 'absorption'
  ],
  EFFECTS: [
    'relaxed', 'happy', 'euphoric', 'uplifted', 'creative', 'energetic',
    'focused', 'sleepy', 'hungry', 'talkative', 'giggly', 'aroused',
    'tingly', 'pain relief', 'anti-anxiety', 'anti-inflammatory'
  ],
  TERPENES: [
    'myrcene', 'limonene', 'caryophyllene', 'terpinolene', 'pinene',
    'humulene', 'linalool', 'ocimene', 'bisabolol', 'camphene', 'carene',
    'geraniol', 'terpineol', 'valencene', 'phellandrene'
  ],
  CANNABINOIDS: [
    'thc', 'cbd', 'cbn', 'cbg', 'cbc', 'thcv', 'thca', 'cbda', 'delta-8',
    'delta-9', 'delta-10', 'hhc', 'thcp', 'cbdp'
  ]
};

// Regular expressions for parsing commands
const ADD_CART_REGEX = /\b(add|put|include|place|insert|grab)\b.+\b(to cart|to order|to basket|to my order|to my cart)\b/i;
const QUANTITY_REGEX = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i;
const PRODUCT_TYPE_REGEX = new RegExp(`\\b(${CANNABIS_TERMS.CATEGORIES.join('|')})\\b`, 'i');
const PRODUCT_NAME_REGEX = new RegExp(`\\b(${CANNABIS_TERMS.STRAINS.join('|')})\\b`, 'i');
const INVENTORY_REGEX = /\b(show|display|list|view|check|see)\b.+\b(inventory|stock|products|items|supply|merchandise)\b/i;
const INVENTORY_FILTER_REGEX = new RegExp(`\\b(for|of|with|in the|from the|under)\\b.+\\b(${CANNABIS_TERMS.CATEGORIES.join('|')})\\b`, 'i');
const OPEN_FLOAT_REGEX = /\b(open|start|initialize|begin|set up|create)\b.+\b(float|cash float|register|till|drawer|cash drawer)\b/i;
const CLOSE_FLOAT_REGEX = /\b(close|end|finalize|complete|finish|reconcile)\b.+\b(float|cash float|register|till|drawer|cash drawer|day)\b/i;
const FLOAT_AMOUNT_REGEX = /\b(with|for|of|at|containing|holding|having)\b.+\$([\d,.]+)\b/i;
const DISCOUNT_REGEX = /\b(apply|add|give|provide|offer)\b.+\b(discount|sale|promotion|deal|coupon|percent off|percentage off)\b/i;
const DISCOUNT_AMOUNT_REGEX = /\b(\d+)%\b|\b(\d+)\s+percent\b/i;
const VOID_ITEM_REGEX = /\b(void|remove|delete|cancel|take off|eliminate)\b.+\b(item|product|order|from cart|from order|from basket)\b/i;
const COMPLETE_SALE_REGEX = /\b(complete|finish|process|finalize|checkout|check out|pay for)\b.+\b(sale|order|transaction|purchase|cart|basket)\b/i;
const PAYMENT_METHOD_REGEX = /\b(with|using|via|by|through)\b.+\b(cash|credit|debit|card|e-transfer|interac|tap|apple pay|google pay)\b/i;
const RETURN_ITEM_REGEX = /\b(return|refund|exchange|take back)\b.+\b(item|product|purchase|order|transaction)\b/i;
const CHECK_PRICE_REGEX = /\b(check|what is|what's|how much|price of|cost of)\b.+\b(price|cost|value|worth)\b/i;
const VIEW_REPORTS_REGEX = /\b(view|show|display|generate|pull up|see)\b.+\b(report|reports|sales|analytics|statistics|numbers|data|summary)\b/i;
const REPORT_TYPE_REGEX = /\b(daily|weekly|monthly|quarterly|yearly|annual|today's|yesterday's|this week's|this month's)\b/i;
const HELP_REGEX = /\b(help|assist|support|guide|how to|how do I|instructions|tutorial)\b/i;

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
 * @returns {Object} The parsed command with intent and parameters
 */
export const parseCommand = async (command) => {
  try {
    if (!command) return { type: INTENT_TYPES.UNKNOWN };
    
    // Convert command to lowercase for easier matching
    const lowerCommand = command.toLowerCase();
    
    // Check for help intent
    if (HELP_REGEX.test(lowerCommand)) {
      return {
        type: INTENT_TYPES.HELP,
        topic: extractHelpTopic(lowerCommand)
      };
    }
    
    // Check for add to cart intent
    if (ADD_CART_REGEX.test(lowerCommand)) {
      // Extract product name
      const productNameMatch = lowerCommand.match(PRODUCT_NAME_REGEX);
      const productName = productNameMatch ? productNameMatch[0] : null;
      
      // Extract product type
      const productTypeMatch = lowerCommand.match(PRODUCT_TYPE_REGEX);
      const productType = productTypeMatch ? productTypeMatch[0] : null;
      
      // Extract quantity
      const quantityMatch = lowerCommand.match(QUANTITY_REGEX);
      let quantity = 1; // Default quantity
      
      if (quantityMatch) {
        const quantityText = quantityMatch[0];
        quantity = WORD_TO_NUMBER[quantityText] || parseInt(quantityText, 10) || 1;
      }
      
      // Search for products based on extracted information
      let products = [];
      
      if (productName) {
        products = await searchProducts(productName);
      } else if (productType) {
        products = await searchProducts(productType);
      }
      
      return {
        type: INTENT_TYPES.ADD_TO_CART,
        productName,
        productType,
        quantity,
        products
      };
    }
    
    // Check for show inventory intent
    if (INVENTORY_REGEX.test(lowerCommand)) {
      // Extract filter
      const filterMatch = lowerCommand.match(INVENTORY_FILTER_REGEX);
      let filter = null;
      
      if (filterMatch) {
        const filterText = filterMatch[0];
        const categoryMatch = filterText.match(PRODUCT_TYPE_REGEX);
        filter = categoryMatch ? categoryMatch[0] : null;
      }
      
      // Get products based on filter
      const products = filter ? 
        await searchProducts(filter) : 
        await getProducts();
      
      return {
        type: INTENT_TYPES.SHOW_INVENTORY,
        filter,
        products
      };
    }
    
    // Check for open float intent
    if (OPEN_FLOAT_REGEX.test(lowerCommand)) {
      // Extract amount
      const amountMatch = lowerCommand.match(FLOAT_AMOUNT_REGEX);
      let amount = 0;
      
      if (amountMatch && amountMatch[2]) {
        amount = parseFloat(amountMatch[2].replace(/,/g, ''));
      }
      
      return {
        type: INTENT_TYPES.OPEN_FLOAT,
        amount
      };
    }
    
    // Check for close float intent
    if (CLOSE_FLOAT_REGEX.test(lowerCommand)) {
      const todayFloat = await getTodayFloat();
      
      return {
        type: INTENT_TYPES.CLOSE_FLOAT,
        float: todayFloat
      };
    }
    
    // Check for apply discount intent
    if (DISCOUNT_REGEX.test(lowerCommand)) {
      // Extract discount percentage
      const discountMatch = lowerCommand.match(DISCOUNT_AMOUNT_REGEX);
      let discountPercent = 0;
      
      if (discountMatch) {
        discountPercent = parseInt(discountMatch[1] || discountMatch[2], 10) || 0;
      }
      
      return {
        type: INTENT_TYPES.APPLY_DISCOUNT,
        discountPercent
      };
    }
    
    // Check for void item intent
    if (VOID_ITEM_REGEX.test(lowerCommand)) {
      // Extract product name
      const productNameMatch = lowerCommand.match(PRODUCT_NAME_REGEX);
      const productName = productNameMatch ? productNameMatch[0] : null;
      
      return {
        type: INTENT_TYPES.VOID_ITEM,
        productName
      };
    }
    
    // Check for complete sale intent
    if (COMPLETE_SALE_REGEX.test(lowerCommand)) {
      // Extract payment method
      const paymentMethodMatch = lowerCommand.match(PAYMENT_METHOD_REGEX);
      let paymentMethod = 'cash'; // Default payment method
      
      if (paymentMethodMatch) {
        const paymentText = paymentMethodMatch[0].toLowerCase();
        if (paymentText.includes('credit') || paymentText.includes('card')) {
          paymentMethod = 'credit';
        } else if (paymentText.includes('debit')) {
          paymentMethod = 'debit';
        } else if (paymentText.includes('e-transfer') || paymentText.includes('interac')) {
          paymentMethod = 'e-transfer';
        } else if (paymentText.includes('apple pay')) {
          paymentMethod = 'apple_pay';
        } else if (paymentText.includes('google pay')) {
          paymentMethod = 'google_pay';
        }
      }
      
      return {
        type: INTENT_TYPES.COMPLETE_SALE,
        paymentMethod
      };
    }
    
    // Check for return item intent
    if (RETURN_ITEM_REGEX.test(lowerCommand)) {
      // Extract product name
      const productNameMatch = lowerCommand.match(PRODUCT_NAME_REGEX);
      const productName = productNameMatch ? productNameMatch[0] : null;
      
      return {
        type: INTENT_TYPES.RETURN_ITEM,
        productName
      };
    }
    
    // Check for check price intent
    if (CHECK_PRICE_REGEX.test(lowerCommand)) {
      // Extract product name
      const productNameMatch = lowerCommand.match(PRODUCT_NAME_REGEX);
      const productName = productNameMatch ? productNameMatch[0] : null;
      
      // Extract product type
      const productTypeMatch = lowerCommand.match(PRODUCT_TYPE_REGEX);
      const productType = productTypeMatch ? productTypeMatch[0] : null;
      
      // Search for products based on extracted information
      let products = [];
      
      if (productName) {
        products = await searchProducts(productName);
      } else if (productType) {
        products = await searchProducts(productType);
      }
      
      return {
        type: INTENT_TYPES.CHECK_PRICE,
        productName,
        productType,
        products
      };
    }
    
    // Check for view reports intent
    if (VIEW_REPORTS_REGEX.test(lowerCommand)) {
      // Extract report type
      const reportTypeMatch = lowerCommand.match(REPORT_TYPE_REGEX);
      let reportType = 'daily'; // Default report type
      
      if (reportTypeMatch) {
        const reportText = reportTypeMatch[0].toLowerCase();
        if (reportText.includes('weekly')) {
          reportType = 'weekly';
        } else if (reportText.includes('monthly')) {
          reportType = 'monthly';
        } else if (reportText.includes('quarterly')) {
          reportType = 'quarterly';
        } else if (reportText.includes('yearly') || reportText.includes('annual')) {
          reportType = 'yearly';
        }
      }
      
      return {
        type: INTENT_TYPES.VIEW_REPORTS,
        reportType
      };
    }
    
    // If no intent matched, return unknown
    return { type: INTENT_TYPES.UNKNOWN };
  } catch (error) {
    console.error('Error parsing command:', error);
    return { type: INTENT_TYPES.ERROR, error: error.message };
  }
};

/**
 * Extract help topic from command
 * @param {string} command - The help command
 * @returns {string} The extracted help topic
 */
const extractHelpTopic = (command) => {
  // Check for specific help topics
  if (command.includes('inventory') || command.includes('stock')) {
    return 'inventory';
  } else if (command.includes('cart') || command.includes('order') || command.includes('add')) {
    return 'cart';
  } else if (command.includes('float') || command.includes('cash') || command.includes('register')) {
    return 'cash_float';
  } else if (command.includes('discount') || command.includes('promotion')) {
    return 'discounts';
  } else if (command.includes('sale') || command.includes('checkout') || command.includes('payment')) {
    return 'checkout';
  } else if (command.includes('report') || command.includes('analytics')) {
    return 'reports';
  } else if (command.includes('voice') || command.includes('command') || command.includes('speak')) {
    return 'voice_commands';
  }
  
  // Default to general help
  return 'general';
};

/**
 * Process a natural language command
 * @param {string} command - The natural language command
 * @returns {Object} The result of processing the command
 */
export const processCommand = async (command) => {
  try {
    const parsedCommand = await parseCommand(command);
    
    // Generate response based on intent
    let response = '';
    
    switch (parsedCommand.type) {
      case INTENT_TYPES.ADD_TO_CART:
        response = handleAddToCart(parsedCommand);
        break;
      case INTENT_TYPES.SHOW_INVENTORY:
        response = handleShowInventory(parsedCommand);
        break;
      case INTENT_TYPES.OPEN_FLOAT:
        response = handleOpenFloat(parsedCommand);
        break;
      case INTENT_TYPES.CLOSE_FLOAT:
        response = handleCloseFloat(parsedCommand);
        break;
      case INTENT_TYPES.APPLY_DISCOUNT:
        response = handleApplyDiscount(parsedCommand);
        break;
      case INTENT_TYPES.VOID_ITEM:
        response = handleVoidItem(parsedCommand);
        break;
      case INTENT_TYPES.COMPLETE_SALE:
        response = handleCompleteSale(parsedCommand);
        break;
      case INTENT_TYPES.RETURN_ITEM:
        response = handleReturnItem(parsedCommand);
        break;
      case INTENT_TYPES.CHECK_PRICE:
        response = handleCheckPrice(parsedCommand);
        break;
      case INTENT_TYPES.VIEW_REPORTS:
        response = handleViewReports(parsedCommand);
        break;
      case INTENT_TYPES.HELP:
        response = handleHelp(parsedCommand);
        break;
      case INTENT_TYPES.UNKNOWN:
        response = "I'm sorry, I didn't understand that command. Try saying something like 'add Blue Dream to cart' or 'show inventory'.";
        break;
      case INTENT_TYPES.ERROR:
        response = `Sorry, there was an error processing your command: ${parsedCommand.error}`;
        break;
    }
    
    return {
      type: parsedCommand.type,
      response,
      parsedCommand
    };
  } catch (error) {
    console.error('Error processing command:', error);
    return {
      type: INTENT_TYPES.ERROR,
      response: `Sorry, there was an error processing your command: ${error.message}`,
      error: error.message
    };
  }
};

/**
 * Handle add to cart intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleAddToCart = (parsedCommand) => {
  const { productName, productType, quantity, products } = parsedCommand;
  
  if (products && products.length > 0) {
    const product = products[0]; // Use the first matching product
    return `Added ${quantity} ${product.name} to your cart.`;
  } else if (productName) {
    return `I couldn't find "${productName}" in our inventory. Would you like to see similar products?`;
  } else if (productType) {
    return `I couldn't find any "${productType}" products. Would you like to see our available categories?`;
  } else {
    return "I couldn't determine which product you want to add. Could you please specify the product name or type?";
  }
};

/**
 * Handle show inventory intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleShowInventory = (parsedCommand) => {
  const { filter, products } = parsedCommand;
  
  if (products && products.length > 0) {
    if (filter) {
      return `Showing ${products.length} ${filter} products in inventory.`;
    } else {
      return `Showing all ${products.length} products in inventory.`;
    }
  } else if (filter) {
    return `No ${filter} products found in inventory.`;
  } else {
    return "No products found in inventory.";
  }
};

/**
 * Handle open float intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleOpenFloat = (parsedCommand) => {
  const { amount } = parsedCommand;
  
  if (amount > 0) {
    initializeDailyFloat(amount);
    return `Cash float opened with $${amount.toFixed(2)}.`;
  } else {
    return "Please specify an amount to open the cash float. For example, 'open float with $200'.";
  }
};

/**
 * Handle close float intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleCloseFloat = (parsedCommand) => {
  const { float } = parsedCommand;
  
  if (float) {
    closeDailyFloat();
    return `Cash float closed. Starting amount: $${float.startAmount.toFixed(2)}, Ending amount: $${float.currentAmount.toFixed(2)}, Difference: $${(float.currentAmount - float.startAmount).toFixed(2)}.`;
  } else {
    return "No active cash float found. Please open a float first.";
  }
};

/**
 * Handle apply discount intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleApplyDiscount = (parsedCommand) => {
  const { discountPercent } = parsedCommand;
  
  if (discountPercent > 0) {
    return `Applied ${discountPercent}% discount to the current order.`;
  } else {
    return "Please specify a discount percentage. For example, 'apply 10% discount'.";
  }
};

/**
 * Handle void item intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleVoidItem = (parsedCommand) => {
  const { productName } = parsedCommand;
  
  if (productName) {
    return `Removed ${productName} from the current order.`;
  } else {
    return "Please specify which item you want to void. For example, 'void Blue Dream from cart'.";
  }
};

/**
 * Handle complete sale intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleCompleteSale = (parsedCommand) => {
  const { paymentMethod } = parsedCommand;
  
  return `Completing sale with ${paymentMethod} payment.`;
};

/**
 * Handle return item intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleReturnItem = (parsedCommand) => {
  const { productName } = parsedCommand;
  
  if (productName) {
    return `Processing return for ${productName}.`;
  } else {
    return "Please specify which item you want to return. For example, 'return Blue Dream'.";
  }
};

/**
 * Handle check price intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleCheckPrice = (parsedCommand) => {
  const { productName, productType, products } = parsedCommand;
  
  if (products && products.length > 0) {
    const product = products[0]; // Use the first matching product
    return `The price of ${product.name} is $${product.price.toFixed(2)}.`;
  } else if (productName) {
    return `I couldn't find "${productName}" in our inventory. Would you like to see similar products?`;
  } else if (productType) {
    return `I couldn't find any "${productType}" products. Would you like to see our available categories?`;
  } else {
    return "I couldn't determine which product you want to check. Could you please specify the product name or type?";
  }
};

/**
 * Handle view reports intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleViewReports = (parsedCommand) => {
  const { reportType } = parsedCommand;
  
  return `Showing ${reportType} sales report.`;
};

/**
 * Handle help intent
 * @param {Object} parsedCommand - The parsed command
 * @returns {string} The response message
 */
const handleHelp = (parsedCommand) => {
  const { topic } = parsedCommand;
  
  switch (topic) {
    case 'inventory':
      return "To check inventory, say 'show inventory' or 'show inventory for indica'. You can filter by product type like sativa, indica, hybrid, edible, etc.";
    case 'cart':
      return "To add items to cart, say 'add Blue Dream to cart' or 'add 3 gummies to cart'. You can specify quantity and product name or type.";
    case 'cash_float':
      return "To manage cash float, say 'open float with $200' to start the day or 'close float' to end the day.";
    case 'discounts':
      return "To apply discounts, say 'apply 10% discount' or 'give 15% off'.";
    case 'checkout':
      return "To complete a sale, say 'complete sale with credit' or 'checkout with cash'.";
    case 'reports':
      return "To view reports, say 'show daily report' or 'view monthly sales'.";
    case 'voice_commands':
      return "You can use voice commands for most operations in CannaFlow. Just speak naturally and I'll try to understand what you need.";
    case 'general':
    default:
      return "CannaFlow AI Assistant helps you manage your dispensary. You can say things like 'add Blue Dream to cart', 'show inventory', 'open float with $200', 'apply 10% discount', 'complete sale', or 'view daily report'. For specific help, say 'help with inventory' or 'help with checkout'.";
  }
};

/**
 * Speak a response using text-to-speech
 * @param {string} text - The text to speak
 * @returns {Promise<void>}
 */
export const speakResponse = async (text) => {
  try {
    // Stop any current speech
    await Speech.stop();
    
    // Set options based on platform
    const options = Platform.OS === 'ios' ? 
      { voice: 'com.apple.ttsbundle.Samantha-compact', rate: 0.5 } : 
      { rate: 0.8 };
    
    // Speak the text
    await Speech.speak(text, options);
  } catch (error) {
    console.error('Error speaking response:', error);
  }
};