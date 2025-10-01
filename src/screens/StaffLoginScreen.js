import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Image, Dimensions } from 'react-native';
import { Surface, Title, Text, Button, TextInput, Divider, Card, Chip } from 'react-native-paper';
import { theme } from '../theme/theme';
import { firebaseAuth, STAFF_ROLES } from '../services/firebaseAuth';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const StaffLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn } = useAuth();

  const handleStaffLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await firebaseAuth.signInStaff(email, password);
      
      if (result.success) {
        // Log staff activity
        await firebaseAuth.logActivity('STAFF_LOGIN', {
          loginMethod: 'email',
          userRole: result.user.role
        });

        // Set user in AuthContext
        await signIn(email, password);

        Alert.alert(
          'Login Successful',
          `Welcome, ${result.user.displayName}! (${result.user.role})`,
          [
            {
              text: 'Continue',
              onPress: () => {
                navigation.replace('Main');
              }
            }
          ]
        );
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Staff login error:', error);
      Alert.alert('Login Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Surface style={styles.header}>
        <Image 
          source={require('../../assets/cannaflow-logo-black.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Title style={styles.title}>Staff Portal</Title>
        <Text style={styles.subtitle}>CannaFlow Dispensary System</Text>
      </Surface>

      {/* Demo Accounts for Testing */}
      <Card style={styles.demoCard}>
        <Card.Title title="Demo Accounts" left={(props) => <Text {...props}>👥</Text>} />
        <Card.Content>
          <Text style={styles.demoText}>Use these demo accounts for testing:</Text>
          
          <View style={styles.demoAccounts}>
            <Chip
              mode="outlined"
              onPress={() => handleDemoLogin({ email: 'manager@cannaflow.com', password: 'manager123' })}
              style={styles.demoChip}
            >
              Manager
            </Chip>
            <Chip
              mode="outlined"
              onPress={() => handleDemoLogin({ email: 'budtender@cannaflow.com', password: 'budtender123' })}
              style={styles.demoChip}
            >
              Budtender
            </Chip>
            <Chip
              mode="outlined"
              onPress={() => handleDemoLogin({ email: 'security@cannaflow.com', password: 'security123' })}
              style={styles.demoChip}
            >
              Security
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Login Form */}
      <Card style={styles.loginCard}>
        <Card.Title title="Staff Login" left={(props) => <Text {...props}>🔐</Text>} />
        <Card.Content>
          <TextInput
            label="Staff Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            left={<TextInput.Icon icon="email" />}
            placeholder="staff@cannaflow.com"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            placeholder="Enter your password"
          />

          <Button
            mode="contained"
            onPress={handleStaffLogin}
            style={styles.loginButton}
            loading={loading}
            disabled={loading}
            icon="login"
          >
            Sign In
          </Button>
        </Card.Content>
      </Card>

      {/* Role Information */}
      <Card style={styles.infoCard}>
        <Card.Title title="Staff Roles" left={(props) => <Text {...props}>📋</Text>} />
        <Card.Content>
          <View style={styles.roleList}>
            <View style={styles.roleItem}>
              <Text style={styles.roleTitle}>👨‍💼 Manager</Text>
              <Text style={styles.roleDesc}>Full system access, reports, staff management</Text>
            </View>
            <View style={styles.roleItem}>
              <Text style={styles.roleTitle}>🌿 Budtender</Text>
              <Text style={styles.roleDesc}>Sales, inventory, customer service</Text>
            </View>
            <View style={styles.roleItem}>
              <Text style={styles.roleTitle}>🛡️ Security</Text>
              <Text style={styles.roleDesc}>Age verification, compliance monitoring</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Compliance Notice */}
      <Card style={styles.complianceCard}>
        <Card.Content>
          <Text style={styles.complianceTitle}>⚠️ Compliance Requirements</Text>
          <Text style={styles.complianceText}>
            • All staff must be 21+{'\n'}
            • ID verification required{'\n'}
            • Purchase limits enforced{'\n'}
            • Activity is logged and monitored{'\n'}
            • Report suspicious activity immediately
          </Text>
        </Card.Content>
      </Card>

      {/* Back to Regular Login */}
      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        style={styles.backButton}
        icon="arrow-left"
      >
        Back to Admin Login
      </Button>

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
  infoCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  roleList: {
    paddingVertical: 8,
  },
  roleItem: {
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  roleDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  complianceCard: {
    marginBottom: 16,
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
  backButton: {
    marginTop: 16,
  },
  bottomPadding: {
    height: 32,
  },
});

export default StaffLoginScreen;