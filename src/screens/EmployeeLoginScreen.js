import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Image, Dimensions } from 'react-native';
import { Surface, Title, Text, Button, TextInput, Card, Chip, Divider } from 'react-native-paper';
import { theme } from '../theme/theme';
import { useEmployee } from '../context/EmployeeContext';
import { useNavigation } from '@react-navigation/native';
import { firebaseAuth } from '../services/firebaseAuth';

const { width } = Dimensions.get('window');

const EmployeeLoginScreen = ({ navigation }) => {
  const { authenticateEmployee, currentEmployee } = useEmployee();
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleEmployeeLogin = async () => {
    if (!employeeId || !pin) {
      Alert.alert('Validation Error', 'Please enter both Employee ID and PIN');
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('Validation Error', 'PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateEmployee(employeeId, pin);
      
      if (result.success) {
        Alert.alert(
          'Login Successful',
          `Welcome, ${result.employee.firstName}!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                navigation.navigate('EmployeeDashboard');
              }
            }
          ]
        );
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error) {
      console.error('Employee login error:', error);
      Alert.alert('Login Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmployee) => {
    setEmployeeId(demoEmployee.employeeId);
    setPin(demoEmployee.pin);
  };

  const demoEmployees = [
    { employeeId: 'EMP001', pin: '1234', role: 'Budtender', name: 'Sarah Johnson' },
    { employeeId: 'EMP002', pin: '5678', role: 'Manager', name: 'Mike Chen' },
    { employeeId: 'EMP003', pin: '9012', role: 'Security', name: 'Lisa Rodriguez' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Surface style={styles.header}>
        <Image 
          source={require('../../assets/cannaflow-logo-black.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Title style={styles.title}>Employee Portal</Title>
        <Text style={styles.subtitle}>CannaFlow Dispensary System</Text>
      </Surface>

      {/* Demo Accounts for Testing */}
      <Card style={styles.demoCard}>
        <Card.Title title="Demo Employee Accounts" left={(props) => <Text {...props}>👥</Text>} />
        <Card.Content>
          <Text style={styles.demoText}>Use these demo accounts for testing:</Text>
          
          <View style={styles.demoAccounts}>
            {demoEmployees.map((employee, index) => (
              <Chip
                key={index}
                mode="outlined"
                onPress={() => handleDemoLogin(employee)}
                style={styles.demoChip}
              >
                {employee.name} ({employee.role})
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Login Form */}
      <Card style={styles.loginCard}>
        <Card.Title title="Employee Login" left={(props) => <Text {...props}>🔐</Text>} />
        <Card.Content>
          <TextInput
            label="Employee ID"
            value={employeeId}
            onChangeText={setEmployeeId}
            style={styles.input}
            mode="outlined"
            placeholder="EMP001"
            autoCapitalize="none"
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="4-Digit PIN"
            value={pin}
            onChangeText={setPin}
            secureTextEntry={!showPin}
            style={styles.input}
            mode="outlined"
            placeholder="1234"
            keyboardType="numeric"
            maxLength={4}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPin ? "eye-off" : "eye"}
                onPress={() => setShowPin(!showPin)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleEmployeeLogin}
            style={styles.loginButton}
            loading={loading}
            disabled={loading}
            icon="login"
          >
            Login
          </Button>
        </Card.Content>
      </Card>

      {/* Employee Benefits */}
      <Card style={styles.benefitsCard}>
        <Card.Title title="Employee Portal Features" left={(props) => <Text {...props}>⭐</Text>} />
        <Card.Content>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>⏰ Time Tracking</Text>
              <Text style={styles.featureDesc}>Clock in/out with automatic hour calculation</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>💰 Payroll Management</Text>
              <Text style={styles.featureDesc}>View pay stubs, calculate earnings, track overtime</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>📊 Performance Metrics</Text>
              <Text style={styles.featureDesc}>Track sales performance and customer ratings</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>🔒 Security & Compliance</Text>
              <Text style={styles.featureDesc}>All activities logged for audit trail</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Security Notice */}
      <Card style={styles.securityCard}>
        <Card.Content>
          <Text style={styles.securityTitle}>🔒 Security Notice</Text>
          <Text style={styles.securityText}>
            • All employee activities are logged and monitored{'\n'}
            • PIN must be kept confidential{'\n'}
            • Report suspicious activity immediately{'\n'}
            • System access is tracked for compliance
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    backgroundColor: theme.colors.primary,
    elevation: 4,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6,
    height: 60,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  demoCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  demoText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
  },
  demoAccounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  demoChip: {
    margin: 4,
  },
  loginCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  input: {
    marginVertical: 8,
  },
  loginButton: {
    marginTop: 16,
  },
  benefitsCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  featuresList: {
    paddingVertical: 8,
  },
  featureItem: {
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  featureDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  securityCard: {
    marginBottom: 16,
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 32,
  },
});

export default EmployeeLoginScreen;