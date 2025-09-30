import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, Dimensions } from 'react-native';
import { Surface, Title, Text, Button, Card, TextInput, IconButton, Chip, FAB, Portal, Dialog, DataTable } from 'react-native-paper';
import { theme } from '../theme/theme';
import { getProducts, addProduct, updateProduct, deleteProduct, searchProducts } from '../database/database';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useBusinessType } from '../context/BusinessTypeContext';

const { width } = Dimensions.get('window');

const InventoryManager = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  const { isRetail } = useBusinessType();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Flower',
    type: 'Hybrid',
    thc: '',
    cbd: '',
    price: '',
    stock: '',
    barcode: '',
    description: ''
  });

  const categories = ['Flower', 'Edible', 'Concentrate', 'Pre-roll', 'Vape', 'Topical', 'Tincture', 'Other'];
  const strainTypes = ['Indica', 'Sativa', 'Hybrid', 'CBD'];

  useEffect(() => {
    loadProducts();
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await getProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await searchProducts(query);
        setProducts(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      loadProducts();
    }
  };

  const handleAddProduct = async () => {
    if (!validateForm()) return;

    try {
      const newProduct = {
        ...formData,
        thc: parseFloat(formData.thc) || 0,
        cbd: parseFloat(formData.cbd) || 0,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0
      };

      await addProduct(newProduct);
      await loadProducts();
      resetForm();
      setShowAddDialog(false);
      Alert.alert('Success', 'Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product');
    }
  };

  const handleEditProduct = async () => {
    if (!validateForm()) return;

    try {
      const updatedProduct = {
        ...formData,
        thc: parseFloat(formData.thc) || 0,
        cbd: parseFloat(formData.cbd) || 0,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0
      };

      await updateProduct(editingProduct.id, updatedProduct);
      await loadProducts();
      resetForm();
      setShowEditDialog(false);
      setEditingProduct(null);
      Alert.alert('Success', 'Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    }
  };

  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${product.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              await loadProducts();
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product name is required');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Valid price is required');
      return false;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      Alert.alert('Validation Error', 'Valid stock quantity is required');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Flower',
      type: 'Hybrid',
      thc: '',
      cbd: '',
      price: '',
      stock: '',
      barcode: '',
      description: ''
    });
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setShowScanner(false);
    
    try {
      // Search for product by barcode
      const results = await searchProducts(data);
      if (results.length > 0) {
        Alert.alert('Product Found', `Found: ${results[0].name}`, [
          { text: 'View Product', onPress: () => openEditDialog(results[0]) },
          { text: 'OK' }
        ]);
      } else {
        Alert.alert('Product Not Found', `No product found with barcode: ${data}`, [
          { text: 'Add New Product', onPress: () => {
            setFormData(prev => ({ ...prev, barcode: data }));
            setShowAddDialog(true);
          }},
          { text: 'Cancel' }
        ]);
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      Alert.alert('Error', 'Failed to process barcode');
    }
    
    setTimeout(() => setScanned(false), 2000);
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      type: product.type,
      thc: product.thc?.toString() || '',
      cbd: product.cbd?.toString() || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      barcode: product.barcode || '',
      description: product.description || ''
    });
    setShowEditDialog(true);
  };

  const renderProductCard = (product) => {
    const isLowStock = product.stock < 10;
    const isOutOfStock = product.stock === 0;

    return (
      <Card key={product.id} style={[styles.productCard, isOutOfStock && styles.outOfStockCard]}>
        <Card.Content>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Title style={styles.productName}>{product.name}</Title>
              <Text style={styles.productDetails}>
                {product.category} • {product.type} • THC: {product.thc}%
              </Text>
              {product.barcode && (
                <Text style={styles.barcode}>Barcode: {product.barcode}</Text>
              )}
            </View>
            <View style={styles.stockInfo}>
              <Chip
                mode="flat"
                style={[styles.stockChip, isLowStock && styles.lowStockChip, isOutOfStock && styles.outOfStockChip]}
                textStyle={styles.stockText}
              >
                Stock: {product.stock}
              </Chip>
              <Text style={styles.price}>${product.price}</Text>
            </View>
          </View>

          {product.description && (
            <Text style={styles.description} numberOfLines={2}>
              {product.description}
            </Text>
          )}

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => openEditDialog(product)}
              style={styles.actionButton}
              icon="pencil"
            >
              Edit
            </Button>
            <Button
              mode="contained"
              onPress={() => handleDeleteProduct(product)}
              style={styles.actionButton}
              buttonColor={theme.colors.error}
              icon="delete"
            >
              Delete
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Surface style={styles.header}>
          <Title style={styles.title}>Inventory Management</Title>
          <Text style={styles.subtitle}>Camera permission required for barcode scanning</Text>
        </Surface>
        <Button
          mode="contained"
          onPress={requestCameraPermission}
          style={styles.permissionButton}
        >
          Grant Camera Permission
        </Button>
      </View>
    );
  }

  if (showScanner) {
    return (
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <Surface style={styles.scannerOverlay}>
          <Title style={styles.scannerTitle}>Scan Barcode</Title>
          <Text style={styles.scannerText}>Align barcode within the frame</Text>
        </Surface>
        <Button
          mode="contained"
          onPress={() => setShowScanner(false)}
          style={styles.cancelScannerButton}
        >
          Cancel
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Title style={styles.title}>Inventory Management</Title>
        <Text style={styles.subtitle}>{isRetail ? 'Retail Store' : 'Licensed Producer'} Inventory</Text>
      </Surface>

      {/* Search and Actions */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchInput}
          mode="outlined"
          left={<TextInput.Icon icon="magnify" />}
        />
        <Button
          mode="contained"
          onPress={() => setShowScanner(true)}
          style={styles.scanButton}
          icon="barcode"
        >
          Scan
        </Button>
      </View>

      {/* Stock Alerts */}
      <View style={styles.alertsContainer}>
        <Chip
          mode="flat"
          style={styles.alertChip}
          textStyle={styles.alertText}
        >
          Low Stock Items
        </Chip>
        <Chip
          mode="flat"
          style={styles.alertChip}
          textStyle={styles.alertText}
        >
          Out of Stock
        </Chip>
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading inventory...</Text>
        </View>
      ) : (
        <ScrollView style={styles.productsContainer}>
          {products.map(renderProductCard)}
        </ScrollView>
      )}

      {/* Add Product FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="Add Product"
        onPress={() => {
          resetForm();
          setShowAddDialog(true);
        }}
      />

      {/* Add Product Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add New Product</Dialog.Title>
          <Dialog.Content>
            <ScrollView>
              <TextInput
                label="Product Name"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Category"
                value={formData.category}
                onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Strain Type"
                value={formData.type}
                onChangeText={(text) => setFormData(prev => ({ ...prev, type: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="THC %"
                value={formData.thc}
                onChangeText={(text) => setFormData(prev => ({ ...prev, thc: text }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="CBD %"
                value={formData.cbd}
                onChangeText={(text) => setFormData(prev => ({ ...prev, cbd: text }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="Price ($)"
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="Stock Quantity"
                value={formData.stock}
                onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="Barcode"
                value={formData.barcode}
                onChangeText={(text) => setFormData(prev => ({ ...prev, barcode: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Description"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onPress={handleAddProduct}>Add Product</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Product Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Product</Dialog.Title>
          <Dialog.Content>
            <ScrollView>
              <TextInput
                label="Product Name"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Category"
                value={formData.category}
                onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Strain Type"
                value={formData.type}
                onChangeText={(text) => setFormData(prev => ({ ...prev, type: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="THC %"
                value={formData.thc}
                onChangeText={(text) => setFormData(prev => ({ ...prev, thc: text }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="CBD %"
                value={formData.cbd}
                onChangeText={(text) => setFormData(prev => ({ ...prev, cbd: text }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="Price ($)"
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="Stock Quantity"
                value={formData.stock}
                onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="Barcode"
                value={formData.barcode}
                onChangeText={(text) => setFormData(prev => ({ ...prev, barcode: text }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Description"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleEditProduct}>Save Changes</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
    elevation: 4,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginRight: 12,
  },
  scanButton: {
    height: 56,
  },
  alertsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  alertChip: {
    marginHorizontal: 4,
    backgroundColor: '#FF9800',
  },
  alertText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productCard: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  outOfStockCard: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flex: 2,
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
  stockInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  stockChip: {
    backgroundColor: '#4CAF50',
    marginBottom: 4,
  },
  lowStockChip: {
    backgroundColor: '#FF9800',
  },
  outOfStockChip: {
    backgroundColor: '#F44336',
  },
  stockText: {
    color: '#fff',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  cancelScannerButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  permissionButton: {
    margin: 20,
  },
  input: {
    marginVertical: 4,
  },
});

export default InventoryManager;