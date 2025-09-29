import 'react-native';
import React from 'react';
import { AIProvider } from '../src/context/AIContext';
import { processCommand } from '../src/services/aiAssistant';
import { addComplianceLog, LOG_TYPES } from '../src/services/complianceEngine';

// Test that the AI context provider is properly exported
test('AIProvider is exported', () => {
  expect(AIProvider).toBeDefined();
});

// Test that the processCommand function works
test('processCommand function is exported', () => {
  expect(processCommand).toBeDefined();
});

// Test that compliance log types are properly exported
test('Compliance log types are exported', () => {
  expect(LOG_TYPES.SALE).toBeDefined();
  expect(LOG_TYPES.INVENTORY).toBeDefined();
  expect(LOG_TYPES.CASH_FLOAT).toBeDefined();
});

// Test that addComplianceLog function is exported
test('addComplianceLog function is exported', () => {
  expect(addComplianceLog).toBeDefined();
});