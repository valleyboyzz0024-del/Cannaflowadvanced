import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  Text,
  ScrollView,
  SafeAreaView
} from 'react-native';
import {
  Surface,
  Title,
  Searchbar,
  Button,
  FAB,
  Chip,
  ActivityIndicator,
  IconButton,
  List,
  Divider,
  Portal,
  Dialog,
  Card,
  TextInput
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { getProducts, searchProducts } from '../services/productService';
import {
  startVoiceRecognition,
  handleVoiceCommand,
  isMobileVoiceSupported,
  requestVoicePermissions
} from '../services/voiceService';
import { theme, shadowStyles } from '../theme/theme';
import { getSafeThemeValue } from '../theme/themeHelper';
import { firebaseAuth } from '../services/firebaseAuth';
import { useBusinessType } from '../context/BusinessTypeContext';
import CheckoutFlow from '../components/CheckoutFlow';
import ComplianceChecker from '../components/ComplianceChecker';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

const SalesScreenEnhanced = ({ navigation }) => {
  const { addToCart, cartItems, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [voiceCommandResult, setVoiceCommandResult] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [customerAge, setCustomerAge] = useState('');
  const [complianceValid, setComplianceValid] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showStaffActions, setShowStaffActions] = useState(false);

  const { isRetail } = useBusinessType();

  const categories = ['All', 'Flower', 'Concentrate', 'Edible', 'Pre-Roll', 'Vape'];
  const types = ['All', 'Sativa', 'Indica', 'Hybrid', 'CBD'];

  useEffect(() => {
    loadProducts();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await firebaseAuth.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      filterProductsByCategoryAndType(selectedCategory, selectedType);
      return;
    }

    try {
      const results = await searchProducts(query);
      let filtered = results;

      if (selectedCategory && selectedCategory !== 'All') {
        filtered = filtered.filter(product => product.category === selectedCategory);
      }
      if (selectedType && selectedType !== 'All') {
        filtered = filtered.filter(product => product.type === selectedType);
      }

      setFilteredProducts(filtered);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search products');
    }
  };

  const filterProductsByCategoryAndType = (category, type) => {
    let filtered = products;

    if (category && category !== 'All') {
      filtered = filtered.filter(product => product.category === category);
    }
    if (type && type !== 'All') {
      filtered = filtered.filter(product => product.type === type);
    }

    setFilteredProducts(filtered);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    filterProductsByCategoryAndType(category, selectedType);
  };

  const handleTypeFilter = (type) => {
    setSelectedType(type);
    filterProductsByCategoryAndType(selectedCategory, type);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    firebaseAuth.logActivity('ADD_TO_CART', {
      productId: product.id,
      productName: product.name,
      quantity: 1
    });
  };

  const handleVoiceCommand = async () => {
    if (!isMobileVoiceSupported()) {
      Alert.alert('Voice Not Supported', 'Voice commands are not supported on this platform');
      return;
    }

    try {
      const hasPermission = await requestVoicePermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Microphone permission is required for voice commands');
        return;
      }

      setIsListening(true);
      setShowVoiceDialog(true);

      const result = await startVoiceRecognition(
        (command) => {
          console.log('Voice command received:', command);
          processVoiceCommand(command);
        },
        (error) => {
          console.error('Voice recognition error:', error);
          setIsListening(false);
          setShowVoiceDialog(false);
          Alert.alert('Voice Error', 'Failed to process voice command');
        }
      );

      if (!result) {
        setIsListening(false);
        setShowVoiceDialog(false);
      }
    } catch (error) {
      console.error('Voice command error:', error);
      Alert.alert('Voice Error', 'Failed to start voice recognition');
      setIsListening(false);
      setShowVoiceDialog(false);
    }
  };

  const processVoiceCommand = async (command) => {
    try {
      const result = await handleVoiceCommand(command, handleAddToCart);
      setVoiceCommandResult(result);
      
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Command Failed', result.message);
      }
    } catch (error) {
      console.error('Voice command processing error:', error);
      Alert.alert('Voice Error', 'Failed to process voice command');
    } finally {
      setIsListening(false);
      setShowVoiceDialog(false);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before checkout');
      return;
    }

    // Check staff permissions
    if (!currentUser) {
      Alert.alert('Staff Login Required', 'Please login as staff to process sales');
      navigation.navigate('StaffLogin');
      return;
    }

    setShowCompliance(true);
  };

  const handleComplianceComplete = (isValid, age) => {
    setComplianceValid(isValid);
    setCustomerAge(age);
    
    if (isValid) {
      setShowCompliance(false);
      setShowCheckout(true);
    } else {
      Alert.alert('Compliance Failed', 'Please resolve compliance issues before proceeding');
    }
  };

  const handleCheckoutComplete = () => {
    setShowCheckout(false);
    clearCart();
    setCustomerAge('');
    setComplianceValid(false);
    
    // Log successful sale
    firebaseAuth.logActivity('SALE_COMPLETED', {
      itemsCount: cartItems.length,
      totalAmount: total,
      customerAge: customerAge,
      staffId: currentUser?.uid
    });
    
    Alert.alert('Sale Complete', 'Transaction processed successfully');
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => handleAddToCart(item)}
      activeOpacity={0.7}
    >
      <Surface style={styles.productSurface}>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Title style={styles.productName}>{item.name}</Title>
            <Text style={styles.productDetails}>
              {item.category} • {item.type} • THC: {item.thc}%
            </Text>
            {item.barcode && (
              <Text style={styles.barcode}>Barcode: {item.barcode}</Text>
            )}
          </View>
          <View style={styles.productPricing}>
            <Text style={styles.productPrice}>${item.price}</Text>
            <Chip
              mode="flat"
              style={[styles.stockChip, item.stock < 10 && styles.lowStockChip]}
              textStyle={styles.stockText}
            >
              Stock: {item.stock}
            </Chip>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.productActions}>
          <Button
            mode="contained"
            onPress={() => handleAddToCart(item)}
            style={styles.addButton}
            icon="cart-plus"
            compact
          >
            Add to Cart
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
            style={styles.viewButton}
            icon="information"
            compact
          >
            Details
          </Button>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderCartSummary = () => (
    <Surface style={styles.cartSummary}>
      <View style={styles.cartHeader}>
        <Title style={styles.cartTitle}>Current Cart</Title>
        <Chip style={styles.cartCountChip}>
          {cartItems.length} items
        </Chip>
      </View>
      
      {cartItems.map((item, index) => (
        <View key={index} style={styles.cartItem}>
          <View style={styles.cartItemInfo}>
            <Text style={styles.cartItemName}>{item.name}</Text>
            <Text style={styles.cartItemDetails}>
              {item.quantity} x ${item.price}
            </Text>
          </View>
          <View style={styles.cartItemActions}>
            <IconButton
              icon="minus"
              size={16}
              onPress={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
            />
            <Text style={styles.cartItemQuantity}>{item.quantity}</Text>
            <IconButton
              icon="plus"
              size={16}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            />
            <IconButton
              icon="delete"
              size={16}
              onPress={() => removeFromCart(item.id)}
              color={theme.colors.error}
            />
          </View>
        </View>
      ))}
      
      <Divider style={styles.cartDivider} />
      
      <View style={styles.cartTotal}>
        <Text style={styles.cartTotalLabel}>Total:</Text>
        <Text style={styles.cartTotalAmount}>${total.toFixed(2)}</Text>
      </View>
      
      <View style={styles.cartActions}>
        <Button
          mode="outlined"
          onPress={clearCart}
          style={styles.clearButton}
          icon="cart-off"
        >
          Clear Cart
        </Button>
        <Button
          mode="contained"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          icon="cash-register"
          disabled={cartItems.length === 0}
        >
          Checkout
        </Button>
      </View>
    </Surface>
  );

  if (showCompliance) {
    return (
      <SafeAreaView style={styles.container}>
        <ComplianceChecker
          cartItems={cartItems}
          customerAge={customerAge}
          onValidationChange={handleComplianceComplete}
        />
        <View style={styles.complianceActions}>
          <Button
            mode="outlined"
            onPress={() => setShowCompliance(false)}
            style={styles.backButton}
          >
            Back to Cart
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              if (complianceValid) {
                setShowCompliance(false);
                setShowCheckout(true);
              }
            }}
            style={styles.continueButton}
            disabled={!complianceValid}
          >
            Continue to Payment
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (showCheckout) {
    return (
      <SafeAreaView style={styles.container}>
        <CheckoutFlow
          navigation={{
            goBack: () => setShowCheckout(false),
            navigate: (screen) => {
              if (screen === 'Sales') {
                setShowCheckout(false);
                handleCheckoutComplete();
              }
            }
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <Title style={styles.title}>Point of Sale</Title>
          <View style={styles.headerActions}>
            <Button
              mode="outlined"
              onPress={handleVoiceCommand}
              style={styles.voiceButton}
              icon="microphone"
              compact
            >
              Voice
            </Button>
            {currentUser && (
              <Chip style={styles.userChip}>
                {currentUser.displayName} ({currentUser.role})
              </Chip>
            )}
          </View>
        </View>
      </Surface>

      <Portal>
        <Dialog visible={showVoiceDialog} onDismiss={() => setShowVoiceDialog(false)}>
          <Dialog.Title>Voice Command</Dialog.Title>
          <Dialog.Content>
            {isListening ? (
              <View style={styles.voiceContent}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.voiceText}>Listening for your command...</Text>
                <Text style={styles.voiceHint}>Try: "Add two grams of Blue Dream"</Text>
              </View>
            ) : (
              <View style={styles.voiceContent}>
                <MaterialCommunityIcons name="microphone" size={48} color={theme.colors.primary} />
                <Text style={styles.voiceText}>Voice command processed</Text>
                {voiceCommandResult && (
                  <Text style={styles.voiceResult}>
                    {voiceCommandResult.success ? '✅ ' : '❌ '}
                    {voiceCommandResult.message}
                  </Text>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowVoiceDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search products..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {categories.map(category => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => handleCategoryFilter(category)}
              style={styles.filterChip}
              mode="outlined"
            >
              {category}
            </Chip>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {types.map(type => (
            <Chip
              key={type}
              selected={selectedType === type}
              onPress={() => handleTypeFilter(type)}
              style={styles.filterChip}
              mode="outlined"
            >
              {type}
            </Chip>
          ))}
        </ScrollView>

        <View style={styles.mainContent}>
          <View style={styles.productsSection}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading products...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={item => item.id.toString()}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.productsList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {cartItems.length > 0 && (
            <View style={styles.cartSection}>
              {renderCartSummary()}
            </View>
          )}
        </View>
      </View>

      <FAB
        style={styles.fab}
        icon="barcode-scan"
        label="Scan Product"
        onPress={() => {
          // Barcode scanning functionality
          Alert.alert('Barcode Scanner', 'Barcode scanning would open camera here');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.primary,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceButton: {
    marginRight: 8,
  },
  userChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxHeight: 50,
  },
  filterChip: {
    marginRight: 8,
  },
  mainContent: {
    flex: 1,
    flexDirection: isTablet ? 'row' : 'column',
  },
  productsSection: {
    flex: isTablet ? 2 : 1,
    padding: 16,
  },
  cartSection: {
    flex: isTablet ? 1 : undefined,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderLeftWidth: isTablet ? 1 : 0,
    borderTopWidth: isTablet ? 0 : 1,
    borderColor: theme.colors.border,
  },
  productsList: {
    paddingBottom: 80,
  },
  productItem: {
    marginBottom: 12,
  },
  productSurface: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  productDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  barcode: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  productPricing: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  productDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  addButton: {
    flex: 1,
    marginRight: 8,
  },
  viewButton: {
    flex: 1,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  cartSummary: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartCountChip: {
    backgroundColor: theme.colors.primary,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  cartItemDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  cartDivider: {
    marginVertical: 16,
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cartTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  cartActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    flex: 1,
    marginRight: 8,
  },
  checkoutButton: {
    flex: 1,
    marginLeft: 8,
  },
  voiceContent: {
    alignItems: 'center',
    padding: 20,
  },
  voiceText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  voiceHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  voiceResult: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  complianceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  continueButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default SalesScreenEnhanced;