import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Surface, Title, Text, Button, Card, TextInput, Chip } from 'react-native-paper';
import { theme } from '../theme/theme';
import { firebaseAuth } from '../services/firebaseAuth';

// Cannabis purchase limits by state (example - adjust for your jurisdiction)
const PURCHASE_LIMITS = {
  CALIFORNIA: {
    flower: 28.5, // 1 ounce
    concentrate: 8, // 8 grams
    edible: 1000, // 1000mg THC
    totalFlower: 28.5
  },
  COLORADO: {
    flower: 28, // 1 ounce
    concentrate: 8, // 8 grams
    edible: 800, // 800mg THC
    totalFlower: 28
  },
  NEVADA: {
    flower: 28.35, // 1 ounce
    concentrate: 8, // 8 grams
    edible: 1000, // 1000mg THC
    totalFlower: 28.35
  }
};

const ComplianceChecker = ({ cartItems, customerAge, onValidationChange }) => {
  const [validationResults, setValidationResults] = useState({
    ageValid: false,
    purchaseLimitsValid: true,
    idVerified: false,
    intoxicationCheck: false,
    allValid: false
  });

  const [idNumber, setIdNumber] = useState('');
  const [idType, setIdType] = useState('drivers_license');
  const [intoxicationLevel, setIntoxicationLevel] = useState('sober');
  const [staffOverride, setStaffOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    validateCompliance();
  }, [cartItems, customerAge, idNumber, intoxicationLevel, staffOverride]);

  const validateCompliance = async () => {
    const ageValid = validateAge();
    const purchaseLimitsValid = validatePurchaseLimits();
    const idVerified = validateID();
    const intoxicationCheck = validateIntoxication();
    
    const allValid = ageValid && purchaseLimitsValid && idVerified && intoxicationCheck;

    const results = {
      ageValid,
      purchaseLimitsValid,
      idVerified,
      intoxicationCheck,
      allValid
    };

    setValidationResults(results);
    
    if (onValidationChange) {
      onValidationChange(results);
    }
  };

  const validateAge = () => {
    return customerAge && parseInt(customerAge) >= 21;
  };

  const validatePurchaseLimits = () => {
    if (!cartItems || cartItems.length === 0) return true;

    const state = 'CALIFORNIA'; // Default, should be configurable
    const limits = PURCHASE_LIMITS[state];

    let totalFlower = 0;
    let totalConcentrate = 0;
    let totalEdibleTHC = 0;

    cartItems.forEach(item => {
      const quantity = item.quantity || 1;
      
      switch (item.category?.toLowerCase()) {
        case 'flower':
          totalFlower += quantity;
          break;
        case 'concentrate':
          totalConcentrate += quantity;
          break;
        case 'edible':
          // Assuming THC content is stored in the product
          const thcContent = item.thc || 10; // Default 10mg per unit
          totalEdibleTHC += (thcContent * quantity);
          break;
      }
    });

    const withinLimits = 
      totalFlower <= limits.flower &&
      totalConcentrate <= limits.concentrate &&
      totalEdibleTHC <= limits.edible;

    if (!withinLimits && !staffOverride) {
      Alert.alert(
        'Purchase Limit Exceeded',
        `Daily purchase limits exceeded:\n` +
        `Flower: ${totalFlower}g (limit: ${limits.flower}g)\n` +
        `Concentrate: ${totalConcentrate}g (limit: ${limits.concentrate}g)\n` +
        `Edible THC: ${totalEdibleTHC}mg (limit: ${limits.edible}mg)`,
        [
          { text: 'OK' },
          { 
            text: 'Staff Override', 
            onPress: () => {
              setStaffOverride(true);
              Alert.prompt('Override Reason', 'Please provide reason for override:', (reason) => {
                setOverrideReason(reason);
              });
            }
          }
        ]
      );
    }

    return withinLimits || staffOverride;
  };

  const validateID = () => {
    return idNumber && idNumber.length >= 5;
  };

  const validateIntoxication = () => {
    return intoxicationLevel === 'sober' || staffOverride;
  };

  const handleStaffOverride = () => {
    if (!overrideReason.trim()) {
      Alert.alert('Override Required', 'Please provide a reason for the compliance override');
      return;
    }

    firebaseAuth.logActivity('COMPLIANCE_OVERRIDE', {
      reason: overrideReason,
      customerAge: customerAge,
      cartItems: cartItems.length,
      idVerified: idVerified,
      intoxicationLevel: intoxicationLevel
    });

    setStaffOverride(true);
    Alert.alert('Override Applied', 'Compliance override has been logged');
  };

  const logComplianceCheck = async () => {
    await firebaseAuth.logActivity('COMPLIANCE_CHECK', {
      customerAge: customerAge,
      idType: idType,
      idNumber: idNumber ? '***' + idNumber.slice(-4) : null,
      intoxicationLevel: intoxicationLevel,
      cartItemsCount: cartItems.length,
      allValid: validationResults.allValid,
      staffOverride: staffOverride,
      overrideReason: overrideReason
    });
  };

  const getValidationStatus = () => {
    if (validationResults.allValid) {
      return { status: 'valid', color: '#4CAF50', message: '✅ All compliance checks passed' };
    } else if (staffOverride) {
      return { status: 'override', color: '#FF9800', message: '⚠️ Compliance override active' };
    } else {
      return { status: 'invalid', color: '#F44336', message: '❌ Compliance issues detected' };
    }
  };

  const validation = getValidationStatus();

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Title style={styles.title}>Compliance Check</Title>
        <Text style={styles.subtitle}>Verify customer eligibility</Text>
      </Surface>

      {/* Validation Status */}
      <Card style={[styles.statusCard, { backgroundColor: validation.color + '20', borderColor: validation.color }]}>
        <Card.Content>
          <Text style={[styles.statusText, { color: validation.color }]}>
            {validation.message}
          </Text>
        </Card.Content>
      </Card>

      {/* Age Verification */}
      <Card style={styles.section}>
        <Card.Title title="Age Verification" left={(props) => <Text {...props}>🔞</Text>} />
        <Card.Content>
          <TextInput
            label="Customer Age"
            value={customerAge}
            onChangeText={(age) => {
              // This would be passed from parent component
              // For now, we'll use a placeholder
            }}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
            placeholder="Enter customer age"
          />
          <Text style={styles.helperText}>Customer must be 21+ for cannabis purchases</Text>
          {validationResults.ageValid && (
            <Chip mode="flat" style={styles.validChip} textStyle={styles.validText}>
              ✓ Age Verified
            </Chip>
          )}
        </Card.Content>
      </Card>

      {/* ID Verification */}
      <Card style={styles.section}>
        <Card.Title title="ID Verification" left={(props) => <Text {...props}>🆔</Text>} />
        <Card.Content>
          <View style={styles.idTypeContainer}>
            <Chip
              selected={idType === 'drivers_license'}
              onPress={() => setIdType('drivers_license')}
              style={styles.idTypeChip}
            >
              Driver's License
            </Chip>
            <Chip
              selected={idType === 'state_id'}
              onPress={() => setIdType('state_id')}
              style={styles.idTypeChip}
            >
              State ID
            </Chip>
            <Chip
              selected={idType === 'passport'}
              onPress={() => setIdType('passport')}
              style={styles.idTypeChip}
            >
              Passport
            </Chip>
          </View>
          <TextInput
            label="ID Number"
            value={idNumber}
            onChangeText={setIdNumber}
            style={styles.input}
            mode="outlined"
            placeholder="Enter ID number"
          />
          {validationResults.idVerified && (
            <Chip mode="flat" style={styles.validChip} textStyle={styles.validText}>
              ✓ ID Verified
            </Chip>
          )}
        </Card.Content>
      </Card>

      {/* Intoxication Check */}
      <Card style={styles.section}>
        <Card.Title title="Intoxication Assessment" left={(props) => <Text {...props}>🍺</Text>} />
        <Card.Content>
          <Text style={styles.sectionText}>Customer appears to be:</Text>
          <View style={styles.intoxicationContainer}>
            <Chip
              selected={intoxicationLevel === 'sober'}
              onPress={() => setIntoxicationLevel('sober')}
              style={styles.intoxicationChip}
            >
              Sober
            </Chip>
            <Chip
              selected={intoxicationLevel === 'mild'}
              onPress={() => setIntoxicationLevel('mild')}
              style={styles.intoxicationChip}
            >
              Mildly Intoxicated
            </Chip>
            <Chip
              selected={intoxicationLevel === 'intoxicated'}
              onPress={() => setIntoxicationLevel('intoxicated')}
              style={styles.intoxicationChip}
            >
              Intoxicated
            </Chip>
          </View>
          {intoxicationLevel === 'intoxicated' && (
            <Card style={styles.warningCard}>
              <Card.Content>
                <Text style={styles.warningText}>
                  ⚠️ Sale should be refused to intoxicated customers per state regulations.
                </Text>
              </Card.Content>
            </Card>
          )}
          {validationResults.intoxicationCheck && (
            <Chip mode="flat" style={styles.validChip} textStyle={styles.validText}>
              ✓ Intoxication Check Passed
            </Chip>
          )}
        </Card.Content>
      </Card>

      {/* Purchase Limits */}
      <Card style={styles.section}>
        <Card.Title title="Purchase Limits" left={(props) => <Text {...props}>📊</Text>} />
        <Card.Content>
          <Text style={styles.sectionText}>Daily purchase limits (California):</Text>
          <View style={styles.limitsContainer}>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Flower:</Text>
              <Text style={styles.limitValue}>28.5g max</Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Concentrate:</Text>
              <Text style={styles.limitValue}>8g max</Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Edibles:</Text>
              <Text style={styles.limitValue}>1000mg THC max</Text>
            </View>
          </View>
          {validationResults.purchaseLimitsValid && (
            <Chip mode="flat" style={styles.validChip} textStyle={styles.validText}>
              ✓ Within Purchase Limits
            </Chip>
          )}
        </Card.Content>
      </Card>

      {/* Staff Override */}
      {(!validationResults.allValid || staffOverride) && (
        <Card style={styles.overrideCard}>
          <Card.Title title="Staff Override" left={(props) => <Text {...props}>⚡</Text>} />
          <Card.Content>
            <Text style={styles.overrideText}>
              Override requires manager approval and will be logged.
            </Text>
            <TextInput
              label="Override Reason"
              value={overrideReason}
              onChangeText={setOverrideReason}
              style={styles.input}
              mode="outlined"
              placeholder="Explain why override is necessary"
              multiline
              numberOfLines={3}
            />
            <Button
              mode="contained"
              onPress={handleStaffOverride}
              style={styles.overrideButton}
              disabled={!overrideReason.trim()}
            >
              Apply Override
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={logComplianceCheck}
          style={styles.button}
          icon="content-save"
        >
          Log Check
        </Button>
        <Button
          mode="contained"
          onPress={() => {
            // This would proceed to checkout
            console.log('Proceeding to checkout with compliance:', validationResults);
          }}
          style={styles.button}
          disabled={!validationResults.allValid}
          icon="check"
        >
          Proceed to Checkout
        </Button>
      </View>
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
    fontSize: 16,
    opacity: 0.9,
  },
  statusCard: {
    margin: 16,
    borderWidth: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  sectionText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
  },
  idTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  idTypeChip: {
    margin: 4,
  },
  intoxicationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  intoxicationChip: {
    margin: 4,
  },
  limitsContainer: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  limitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  limitLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  limitValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  validChip: {
    backgroundColor: '#4CAF50',
    marginTop: 8,
  },
  validText: {
    color: '#fff',
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 1,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  overrideCard: {
    margin: 16,
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 2,
  },
  overrideText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
  },
  overrideButton: {
    marginTop: 12,
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

export default ComplianceChecker;