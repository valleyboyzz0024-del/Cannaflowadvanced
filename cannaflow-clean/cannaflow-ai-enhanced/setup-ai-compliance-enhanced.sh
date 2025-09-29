#!/bin/bash

# CannaFlow AI Assistant & Compliance Engine Enhanced Setup Script
# This script installs the enhanced AI Assistant and Compliance Engine components

echo "=================================================="
echo "CannaFlow AI Assistant & Compliance Engine Enhanced"
echo "Installation Script"
echo "=================================================="
echo ""

# Check if running in the correct directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: This script must be run from the root of your CannaFlow project."
  echo "Please navigate to your project root directory and try again."
  exit 1
fi

# Create backup of existing files
echo "📦 Creating backup of existing files..."
BACKUP_DIR="./backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR/src/services"
mkdir -p "$BACKUP_DIR/src/components"
mkdir -p "$BACKUP_DIR/src/context"

# Backup existing files if they exist
if [ -f "./src/services/aiAssistant.js" ]; then
  cp "./src/services/aiAssistant.js" "$BACKUP_DIR/src/services/"
  echo "✅ Backed up aiAssistant.js"
fi

if [ -f "./src/services/complianceEngine.js" ]; then
  cp "./src/services/complianceEngine.js" "$BACKUP_DIR/src/services/"
  echo "✅ Backed up complianceEngine.js"
fi

if [ -f "./src/components/AIAssistant.js" ]; then
  cp "./src/components/AIAssistant.js" "$BACKUP_DIR/src/components/"
  echo "✅ Backed up AIAssistant.js"
fi

if [ -f "./src/components/AIFloatingButton.js" ]; then
  cp "./src/components/AIFloatingButton.js" "$BACKUP_DIR/src/components/"
  echo "✅ Backed up AIFloatingButton.js"
fi

if [ -f "./src/components/ComplianceDashboard.js" ]; then
  cp "./src/components/ComplianceDashboard.js" "$BACKUP_DIR/src/components/"
  echo "✅ Backed up ComplianceDashboard.js"
fi

if [ -f "./src/context/AIContext.js" ]; then
  cp "./src/context/AIContext.js" "$BACKUP_DIR/src/context/"
  echo "✅ Backed up AIContext.js"
fi

echo "✅ Backup completed to $BACKUP_DIR"
echo ""

# Install required dependencies
echo "📦 Installing required dependencies..."
npm install --save react-native-chart-kit @react-native-community/datetimepicker xlsx

# Check if installation was successful
if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to install dependencies."
  echo "Please try installing them manually:"
  echo "npm install --save react-native-chart-kit @react-native-community/datetimepicker xlsx"
  exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Create directories if they don't exist
echo "📁 Creating directories..."
mkdir -p ./src/services
mkdir -p ./src/components
mkdir -p ./src/context

echo "✅ Directories created"
echo ""

# Copy enhanced files
echo "📄 Copying enhanced AI Assistant and Compliance Engine files..."

# Copy service files
cp ./cannaflow-ai-enhanced/aiAssistant.js ./src/services/
cp ./cannaflow-ai-enhanced/complianceEngine.js ./src/services/

# Copy component files
cp ./cannaflow-ai-enhanced/AIAssistant.js ./src/components/
cp ./cannaflow-ai-enhanced/AIFloatingButton.js ./src/components/
cp ./cannaflow-ai-enhanced/ComplianceDashboard.js ./src/components/

# Copy context files
cp ./cannaflow-ai-enhanced/AIContext.js ./src/context/

echo "✅ Files copied successfully"
echo ""

# Check if App.js exists and update it
if [ -f "./App.js" ]; then
  echo "🔄 Updating App.js to include AIProvider..."
  
  # Create backup of App.js
  cp "./App.js" "$BACKUP_DIR/"
  
  # Check if AIProvider is already imported
  if grep -q "AIProvider" "./App.js"; then
    echo "✅ AIProvider already imported in App.js"
  else
    # Add AIProvider import and wrap the app
    sed -i.bak '
      /^import/a\
import { AIProvider } from "./src/context/AIContext";
      /return (/a\
      <AIProvider>
      /return (/,/<\/[A-Za-z]*Provider>/ s/<\/[A-Za-z]*Provider>/<\/&\n      <\/AIProvider>/
    ' "./App.js"
    
    # Check if the update was successful
    if grep -q "AIProvider" "./App.js"; then
      echo "✅ App.js updated successfully"
    else
      echo "⚠️ Could not automatically update App.js"
      echo "Please manually add AIProvider to your App.js as described in the README"
    fi
  fi
fi

# Check for AppNavigator.js or similar navigation file
NAV_FILES=("./src/navigation/AppNavigator.js" "./src/navigation/index.js" "./src/App.js")
NAV_FILE_FOUND=false

for nav_file in "${NAV_FILES[@]}"; do
  if [ -f "$nav_file" ]; then
    echo "🔄 Found navigation file: $nav_file"
    
    # Create backup
    cp "$nav_file" "$BACKUP_DIR/"
    
    # Check if AIFloatingButton is already imported
    if grep -q "AIFloatingButton" "$nav_file"; then
      echo "✅ AIFloatingButton already imported in $nav_file"
    else
      # Add AIFloatingButton import and component
      sed -i.bak '
        /^import/a\
import AIFloatingButton from "../components/AIFloatingButton";
        /return (/,/<\/[A-Za-z]*>/ s/<\/[A-Za-z]*>/<AIFloatingButton \/>\n      &/
      ' "$nav_file"
      
      # Check if the update was successful
      if grep -q "AIFloatingButton" "$nav_file"; then
        echo "✅ $nav_file updated successfully"
      else
        echo "⚠️ Could not automatically update $nav_file"
        echo "Please manually add AIFloatingButton to your navigation as described in the README"
      fi
    fi
    
    NAV_FILE_FOUND=true
    break
  fi
done

if [ "$NAV_FILE_FOUND" = false ]; then
  echo "⚠️ Could not find navigation file to add AIFloatingButton"
  echo "Please manually add AIFloatingButton to your main navigation component as described in the README"
fi

echo ""
echo "=================================================="
echo "✅ Installation Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. If App.js or navigation files weren't automatically updated,"
echo "   please follow the manual integration steps in the README."
echo "2. Restart your development server:"
echo "   npm start -- --reset-cache"
echo "3. Rebuild your app if running on a device/emulator."
echo ""
echo "📚 Documentation can be found in:"
echo "   ./cannaflow-ai-enhanced/README_AI_COMPLIANCE_ENHANCED.md"
echo ""
echo "If you encounter any issues, please refer to the troubleshooting"
echo "section in the README or contact support."
echo "=================================================="