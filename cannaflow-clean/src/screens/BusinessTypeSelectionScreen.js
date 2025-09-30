import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  ScrollView,
  StatusBar
} from 'react-native';
import {
  Surface,
  Title,
  Paragraph,
  Button,
  Card,
  Text
} from 'react-native-paper';
import { useBusinessType, BUSINESS_TYPES } from '../context/BusinessTypeContext';
import { theme } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const BusinessTypeSelectionScreen = ({ navigation }) => {
  const { setBusinessType } = useBusinessType();
  const [selectedType, setSelectedType] = useState(null);

  const handleSelectType = async (type) => {
    setSelectedType(type);
  };

  const handleContinue = async () => {
    if (selectedType) {
      await setBusinessType(selectedType);
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/cannaflow-logo-black.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Title style={styles.title}>Welcome to CannaFlow</Title>
          <Paragraph style={styles.subtitle}>
            Choose your business type to get started
          </Paragraph>
        </View>

        <View style={styles.cardsContainer}>
          <Card
            style={[
              styles.card,
              selectedType === BUSINESS_TYPES.RETAIL && styles.selectedCard
            ]}
            onPress={() => handleSelectType(BUSINESS_TYPES.RETAIL)}
          >
            <Card.Content>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>🏪</Text>
              </View>
              <Title style={styles.cardTitle}>Retail Store</Title>
              <Paragraph style={styles.cardDescription}>
                Perfect for cannabis dispensaries and retail operations
              </Paragraph>
              <View style={styles.featuresList}>
                <Text style={styles.featureItem}>• Point of Sale System</Text>
                <Text style={styles.featureItem}>• Inventory Management</Text>
                <Text style={styles.featureItem}>• Sales Analytics</Text>
                <Text style={styles.featureItem}>• Customer Management</Text>
                <Text style={styles.featureItem}>• Cash Float Tracking</Text>
                <Text style={styles.featureItem}>• Compliance Reporting</Text>
              </View>
            </Card.Content>
          </Card>

          <Card
            style={[
              styles.card,
              selectedType === BUSINESS_TYPES.GROW && styles.selectedCard
            ]}
            onPress={() => handleSelectType(BUSINESS_TYPES.GROW)}
          >
            <Card.Content>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>🌱</Text>
              </View>
              <Title style={styles.cardTitle}>Licensed Producer</Title>
              <Paragraph style={styles.cardDescription}>
                Designed for cultivation facilities and licensed producers
              </Paragraph>
              <View style={styles.featuresList}>
                <Text style={styles.featureItem}>• Plant Tracking</Text>
                <Text style={styles.featureItem}>• Harvest Management</Text>
                <Text style={styles.featureItem}>• Batch Traceability</Text>
                <Text style={styles.featureItem}>• Compliance Tracking</Text>
                <Text style={styles.featureItem}>• Grow Room Management</Text>
                <Text style={styles.featureItem}>• Inventory & Float</Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!selectedType}
          style={styles.continueButton}
          contentStyle={styles.continueButtonContent}
        >
          Continue
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: width * 0.6,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  cardsContainer: {
    marginBottom: 30,
  },
  card: {
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    elevation: 8,
  },
  cardIcon: {
    alignItems: 'center',
    marginBottom: 15,
  },
  iconText: {
    fontSize: 48,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: theme.colors.text,
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.textSecondary,
  },
  featuresList: {
    marginTop: 10,
  },
  featureItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
    paddingLeft: 10,
  },
  continueButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  continueButtonContent: {
    paddingVertical: 8,
  },
});

export default BusinessTypeSelectionScreen;