# CannaFlow AI Assistant & Canada Compliance Engine - Installation Guide

This guide provides step-by-step instructions for installing and configuring the CannaFlow AI Assistant and Canada Compliance Engine.

## Prerequisites

- CannaFlow POS system installed and running
- Node.js and npm installed
- Expo CLI installed (if using Expo)

## Installation Steps

### 1. Extract the ZIP File

Extract the `cannaflow-ai-compliance.zip` file to a temporary location.

### 2. Copy Files to Your Project

Copy the extracted files to your CannaFlow project:

```bash
# Copy component files
cp -r cannaflow-ai-compliance/src/components/* your-project/src/components/

# Copy context files
cp -r cannaflow-ai-compliance/src/context/* your-project/src/context/

# Copy service files
cp -r cannaflow-ai-compliance/src/services/* your-project/src/services/

# Copy documentation
cp cannaflow-ai-compliance/README_AI_COMPLIANCE.md your-project/
```

### 3. Install Dependencies

Run the setup script to install the necessary dependencies:

```bash
cd your-project
chmod +x setup-ai-compliance.sh
./setup-ai-compliance.sh
```

Alternatively, you can install the dependencies manually:

```bash
npm install expo-speech@~10.2.0 \
          expo-file-system@~14.0.0 \
          expo-sharing@~10.2.0 \
          expo-document-picker@~10.2.0
```

### 4. Update Your App.js File

Modify your `App.js` file to include the AIProvider:

```javascript
import { AIProvider } from './src/context/AIContext';

// Inside your component tree, wrap your app with AIProvider
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.background}
        />
        <AuthProvider>
          <CartProvider>
            <AIProvider>
              <AppNavigator />
            </AIProvider>
          </CartProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
```

### 5. Update Your AppNavigator.js File

Modify your `AppNavigator.js` file to include the AIFloatingButton component:

```javascript
import AIFloatingButton from '../components/AIFloatingButton';
import { useAI } from '../context/AIContext';
import { useCart } from '../context/CartContext';

// Inside your main tabs component, add the AIFloatingButton
const MainTabsWithAI = () => {
  const { addToCart } = useCart();
  
  // Callback handlers for AI Assistant
  const handleAddToCart = (product, quantity) => {
    addToCart(product, quantity);
  };
  
  const handleShowInventory = (filter, products) => {
    // Navigate to inventory with filter
  };
  
  const handleOpenFloat = (amount) => {
    // Navigate to cash float screen
  };
  
  const handleCloseFloat = (amount) => {
    // Close cash float
  };
  
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator>
        {/* Your tab screens */}
      </Tab.Navigator>
      
      {/* AI Floating Button */}
      <AIFloatingButton 
        onAddToCart={handleAddToCart}
        onShowInventory={handleShowInventory}
        onOpenFloat={handleOpenFloat}
        onCloseFloat={handleCloseFloat}
      />
    </View>
  );
};
```

### 6. Configure the Compliance Engine

The compliance engine needs to be configured for your specific province. This can be done through the Compliance Dashboard UI, or by modifying the default settings in `complianceEngine.js`:

```javascript
// Default compliance settings
const DEFAULT_SETTINGS = {
  province: 'BC', // Change to your province code
  businessName: 'Your Business Name',
  licenseNumber: 'Your License Number',
  location: 'Your Business Address',
  retentionPeriod: 6, // years
  autoExport: false,
  exportFormat: EXPORT_FORMATS.CSV,
  exportEmail: '',
  language: 'en' // 'en' or 'fr'
};
```

### 7. Test the Installation

Run your app and verify that:

1. The AI floating button appears in the bottom right corner
2. Clicking it shows options for AI Assistant and Compliance
3. The AI Assistant can process basic commands
4. The Compliance Dashboard shows correctly

## Troubleshooting

### Common Issues

1. **Missing dependencies**:
   - Error: "Cannot find module 'expo-speech'"
   - Solution: Run `npm install expo-speech@~10.2.0`

2. **Context errors**:
   - Error: "useAI must be used within an AIProvider"
   - Solution: Ensure your component tree is wrapped with AIProvider

3. **Component not rendering**:
   - Issue: AI Floating Button doesn't appear
   - Solution: Check that AIFloatingButton is added to your main component

4. **Permission issues**:
   - Issue: Voice recognition doesn't work
   - Solution: Ensure microphone permissions are granted

## Customization

### AI Assistant

You can customize the AI Assistant by modifying:

- `src/services/aiAssistant.js` - Add more command patterns and responses
- `src/components/AIAssistant.js` - Modify the UI appearance

### Compliance Engine

You can customize the Compliance Engine by modifying:

- `src/services/complianceEngine.js` - Add province-specific formatting
- `src/components/ComplianceDashboard.js` - Modify the dashboard UI

## Support

For additional support, contact the CannaFlow support team at support@canna-flow.com.