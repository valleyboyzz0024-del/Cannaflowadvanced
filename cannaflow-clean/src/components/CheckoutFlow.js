import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Surface, Title, Text, Button, Card, TextInput, Divider, Chip } from 'react-native-paper';
import { useCart } from '../context/CartContext';
import { theme } from '../theme/theme';
import { createSale } from '../database/database';

const CheckoutFlow = ({ navigation }) => {
  const { cartItems, clearCart, getCartTotal } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [customerAge, setCustomerAge] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = getCartTotal();
  const tax = subtotal * 0.15; // 15% tax
  const total = subtotal + tax;

  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0;
    return received - total;
  };

  const validateCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return false;
    }

    if (!customerAge || parseInt(customerAge) < 21) {
      Alert.alert('Error', 'Customer must be 21+ for cannabis purchases');
      return false;
    }

    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived) || 0;
      if (received < total) {
        Alert.alert('Error', 'Insufficient cash received');
        return false;
      }
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateCheckout()) return;

    setLoading(true);
    try {
      const saleData = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        subtotal: subtotal,
        tax: tax,
        total: total,
        payment_method: paymentMethod,
        customer_age: parseInt(customerAge),
        items_count: cartItems.length
      };

      const saleId = await createSale(saleData, cartItems, 1); // userId = 1 for now
      
      // Generate receipt
      const receipt = generateReceipt(saleData);
      
      Alert.alert(
        'Sale Complete!',
        `Total: $${total.toFixed(2)}\nChange: $${calculateChange().toFixed(2)}`,
        [
          { text: 'View Receipt', onPress: () => showReceipt(receipt) },
          { text: 'Done', onPress: () => {
            clearCart();
            navigation.navigate('Sales');
          }}
        ]
      );
    } catch (error) {
      console.error('Error processing sale:', error);
      Alert.alert('Error', 'Failed to process sale');
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = (saleData) => {
    let receipt = 'CannaFlow - RECEIPT\n';
    receipt += `Date: ${saleData.date} ${saleData.time}\n`;
    receipt += `Customer Age: ${saleData.customer_age}\n\n`;
    receipt += 'ITEMS:\n';
    
    cartItems.forEach(item => {
      receipt += `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    receipt += `\nSubtotal: $${saleData.subtotal.toFixed(2)}\n`;
    receipt += `Tax: $${saleData.tax.toFixed(2)}\n`;
    receipt += `Total: $${saleData.total.toFixed(2)}\n`;
    receipt += `Payment: ${paymentMethod.toUpperCase()}\n`;
    receipt += `Change: $${calculateChange().toFixed(2)}\n\n`;
    receipt += 'Thank you for your purchase!\n';
    receipt += 'Must be 21+ to purchase cannabis products';
    
    return receipt;
  };

  const showReceipt = (receipt) => {
    Alert.alert('Receipt', receipt, [
      { text: 'Print', onPress: () => console.log('Printing receipt...') },
      { text: 'Close', onPress: () => {
        clearCart();
        navigation.navigate('Sales');
      }}
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header}>
        <Title style={styles.title}>Checkout</Title>
        <Text style={styles.subtitle}>Complete your purchase</Text>
      </Surface>

      {/* Age Verification */}
      <Card style={styles.section}>
        <Card.Title title="Age Verification" left={(props) => <Text {...props}>🔞</Text>} />
        <Card.Content>
          <TextInput
            label="Customer Age"
            value={customerAge}
            onChangeText={setCustomerAge}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
            placeholder="Must be 21+"
          />
          <Text style={styles.helperText}>Customer must be 21+ for cannabis purchases</Text>
        </Card.Content>
      </Card>

      {/* Order Summary */}
      <Card style={styles.section}>
        <Card.Title title="Order Summary" left={(props) => <Text {...props}>🛒</Text>} />
        <Card.Content>
          {cartItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>x{item.quantity} @ ${item.price}</Text>
              <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <Divider style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (15%):</Text>
            <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Payment Method */}
      <Card style={styles.section}>
        <Card.Title title="Payment Method" left={(props) => <Text {...props}>💳</Text>} />
        <Card.Content>
          <View style={styles.paymentOptions}>
            <Chip
              selected={paymentMethod === 'cash'}
              onPress={() => setPaymentMethod('cash')}
              style={styles.chip}
            >
              Cash
            </Chip>
            <Chip
              selected={paymentMethod === 'card'}
              onPress={() => setPaymentMethod('card')}
              style={styles.chip}
            >
              Card
            </Chip>
            <Chip
              selected={paymentMethod === 'debit'}
              onPress={() => setPaymentMethod('debit')}
              style={styles.chip}
            >
              Debit
            </Chip>
          </View>

          {paymentMethod === 'cash' && (
            <TextInput
              label="Cash Received"
              value={cashReceived}
              onChangeText={setCashReceived}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="cash" />}
            />
          )}

          {paymentMethod === 'cash' && cashReceived && (
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Change:</Text>
              <Text style={styles.changeValue}>${calculateChange().toFixed(2)}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Compliance Notice */}
      <Card style={styles.complianceCard}>
        <Card.Content>
          <Text style={styles.complianceTitle}>⚠️ Compliance Notice</Text>
          <Text style={styles.complianceText}>
            • Customer must be 21+{'\n'}
            • Purchase limits apply{'\n'}
            • ID verification required{'\n'}
            • No sales to intoxicated persons{'\n'}
            • All sales are final
          </Text>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
          disabled={loading}
        >
          Back to Cart
        </Button>
        <Button
          mode="contained"
          onPress={handleCheckout}
          style={styles.button}
          loading={loading}
          disabled={loading}
          icon="check"
        >
          Complete Sale
        </Button>
      </View>
    </ScrollView>
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
  section: {
    margin: 16,
    backgroundColor: theme.colors.surface,
  },
  input: {
    marginVertical: 8,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 2,
  },
  itemDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: theme.colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  chip: {
    marginHorizontal: 4,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  changeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  changeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  complianceCard: {
    margin: 16,
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 1,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  complianceText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default CheckoutFlow;