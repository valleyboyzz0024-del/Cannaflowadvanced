import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Linking,
  Text
} from 'react-native';
import {
  Surface,
  Title,
  Button,
  Divider,
  List,
  Switch,
  Portal,
  Dialog,
  TextInput,
  IconButton,
  Chip,
  Card
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useBusinessType, BUSINESS_TYPES } from '../context/BusinessTypeContext';
import { useComplianceMode } from '../context/ComplianceModeContext';
import { changePassword } from '../services/authService';
import { theme, shadowStyles } from '../theme/theme';

const SettingsScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const { businessType, isRetail, isGrow, clearBusinessType } = useBusinessType();
  const { complianceMode, toggleComplianceMode } = useComplianceMode();
  const [darkMode, setDarkMode] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert('Validation Error', 'All fields are required');
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Validation Error', 'New passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert('Validation Error', 'New password must be at least 6 characters');
        return;
      }

      setProcessing(true);

      const result = await changePassword(user.id, currentPassword, newPassword);

      if (result.success) {
        setShowPasswordDialog(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Success', 'Password changed successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleComplianceMode = async () => {
    const newMode = await toggleComplianceMode();
    Alert.alert(
      'Compliance Mode',
      `Compliance mode ${newMode ? 'enabled' : 'disabled'}`
    );
  };

  const handleChangeBusinessType = () => {
    Alert.alert(
      'Change Business Type',
      'Changing business type will log you out. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await clearBusinessType();
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'BusinessTypeSelection' }]
            });
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }]
            });
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Business Type Section */}
      <Surface style={[styles.section, shadowStyles.medium]}>
        <Title style={styles.sectionTitle}>Business Configuration</Title>
        <Divider style={styles.divider} />
        
        <View style={styles.businessTypeContainer}>
          <Text style={styles.label}>Business Type</Text>
          <Chip
            icon={isRetail ? 'store' : 'sprout'}
            mode="flat"
            style={styles.businessTypeChip}
          >
            {isRetail ? 'Retail Store' : 'Licensed Producer'}
          </Chip>
        </View>

        <Button
          mode="outlined"
          onPress={handleChangeBusinessType}
          style={styles.changeButton}
          icon="swap-horizontal"
        >
          Change Business Type
        </Button>
      </Surface>

      {/* Compliance Mode Section */}
      <Surface style={[styles.section, shadowStyles.medium]}>
        <Title style={styles.sectionTitle}>Compliance Settings</Title>
        <Divider style={styles.divider} />
        
        <List.Item
          title="Compliance Mode"
          description="Enable detailed compliance tracking and reporting"
          left={props => <List.Icon {...props} icon="clipboard-check" />}
          right={() => (
            <Switch
              value={complianceMode}
              onValueChange={handleToggleComplianceMode}
              color={theme.colors.primary}
            />
          )}
        />
      </Surface>

      {/* Account Section */}
      <Surface style={[styles.section, shadowStyles.medium]}>
        <Title style={styles.sectionTitle}>Account</Title>
        <Divider style={styles.divider} />

        <List.Item
          title="Username"
          description={user?.username || 'Not logged in'}
          left={props => <List.Icon {...props} icon="account" />}
        />

        <List.Item
          title="Role"
          description={user?.role || 'N/A'}
          left={props => <List.Icon {...props} icon="shield-account" />}
        />

        <Button
          mode="outlined"
          onPress={() => setShowPasswordDialog(true)}
          style={styles.button}
          icon="lock-reset"
        >
          Change Password
        </Button>
      </Surface>

      {/* App Settings */}
      <Surface style={[styles.section, shadowStyles.medium]}>
        <Title style={styles.sectionTitle}>App Settings</Title>
        <Divider style={styles.divider} />

        <List.Item
          title="Dark Mode"
          description="Always enabled for optimal viewing"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={darkMode}
              disabled={true}
              color={theme.colors.primary}
            />
          )}
        />

        <List.Item
          title="Cash Float Management"
          description="Manage daily cash float"
          left={props => <List.Icon {...props} icon="cash-multiple" />}
          onPress={() => navigation.navigate('CashFloat')}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </Surface>

      {/* About Section */}
      <Surface style={[styles.section, shadowStyles.medium]}>
        <Title style={styles.sectionTitle}>About</Title>
        <Divider style={styles.divider} />

        <List.Item
          title="Version"
          description="1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
        />

        <List.Item
          title="Support"
          description="Get help and support"
          left={props => <List.Icon {...props} icon="help-circle" />}
          onPress={() => Linking.openURL('mailto:support@cannaflow.com')}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </Surface>

      {/* Logout Button */}
      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        icon="logout"
        buttonColor={theme.colors.error}
      >
        Logout
      </Button>

      {/* Password Change Dialog */}
      <Portal>
        <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)}>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon
                  icon={showCurrentPassword ? "eye-off" : "eye"}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                />
              }
            />
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon
                  icon={showNewPassword ? "eye-off" : "eye"}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                />
              }
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showNewPassword}
              style={styles.input}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button
              onPress={handleChangePassword}
              loading={processing}
              disabled={processing}
            >
              Change
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
    backgroundColor: theme.colors.border,
  },
  businessTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
  },
  businessTypeChip: {
    backgroundColor: theme.colors.primary,
  },
  changeButton: {
    marginTop: 8,
  },
  button: {
    marginTop: 16,
  },
  logoutButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  input: {
    marginBottom: 12,
  },
});

export default SettingsScreen;