#!/bin/bash

# CannaFlow Advanced - Build Script for Android APK
# Run this script to build the production-ready APK

echo "🚀 Starting CannaFlow Advanced APK Build Process..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_info "Current directory: $(pwd)"
print_info "Node version: $(node --version)"
print_info "NPM version: $(npm --version)"

# Step 1: Clean previous builds
print_info "Step 1: Cleaning previous builds..."
rm -rf android/build
rm -rf ios/build
rm -rf node_modules/.cache
print_success "Previous builds cleaned"

# Step 2: Install dependencies
print_info "Step 2: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed"

# Step 3: Run prebuild
print_info "Step 3: Running Expo prebuild..."
npx expo prebuild --clean
if [ $? -ne 0 ]; then
    print_error "Prebuild failed"
    exit 1
fi
print_success "Prebuild completed"

# Step 4: Build Android APK
print_info "Step 4: Building Android APK..."
cd android
./gradlew assembleRelease
if [ $? -ne 0 ]; then
    print_error "Android build failed"
    exit 1
fi
print_success "Android APK built successfully"

# Step 5: Locate the APK
print_info "Step 5: Locating APK file..."
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    print_success "APK found at: $APK_PATH"
    print_info "APK Size: $(ls -lh $APK_PATH | awk '{print $5}')"
else
    print_error "APK not found at expected location"
    exit 1
fi

# Step 6: Verify APK
print_info "Step 6: Verifying APK..."
cd ..
if command -v aapt &> /dev/null; then
    print_info "APK Information:"
    aapt dump badging $APK_PATH | head -10
else
    print_info "aapt not found, skipping detailed APK verification"
fi

# Step 7: Generate checksum
print_info "Step 7: Generating checksum..."
if command -v sha256sum &> /dev/null; then
    CHECKSUM=$(sha256sum $APK_PATH | awk '{print $1}')
    print_success "SHA256 Checksum: $CHECKSUM"
    echo "$CHECKSUM" > "cannaflow-checksum.txt"
else
    print_info "sha256sum not found, skipping checksum generation"
fi

# Step 8: Installation instructions
print_success "✅ BUILD COMPLETED SUCCESSFULLY!"
echo ""
echo "📱 Installation Instructions:"
echo "=============================="
echo "1. Enable 'Unknown Sources' on Android device:"
echo "   Settings > Security > Unknown Sources"
echo ""
echo "2. Transfer APK to device:"
echo "   - Via USB: adb install $APK_PATH"
echo "   - Via file transfer"
echo ""
echo "3. Install the APK:"
echo "   - Tap the APK file"
echo "   - Follow installation prompts"
echo ""
echo "4. Launch the app:"
echo "   - Look for 'CannaFlow Advanced' icon"
echo "   - Use demo credentials for testing"
echo ""
echo "🔧 Demo Credentials:"
echo "=================="
echo "Admin Login:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Staff Login:"
echo "  Manager: manager@cannaflow.com / manager123"
echo "  Budtender: budtender@cannaflow.com / budtender123"
echo "  Security: security@cannaflow.com / security123"
echo ""
echo "📊 Key Features to Test:"
echo "======================="
echo "✅ Business type selection (Retail vs Grow)"
echo "✅ Product search and barcode scanning"
echo "✅ Cart management and checkout"
echo "✅ Age verification and compliance"
echo "✅ Analytics dashboard"
echo "✅ Voice commands"
echo "✅ Staff authentication"
echo "✅ Inventory management"
echo ""
echo "🆘 Support:"
echo "=========="
echo "For issues or questions:"
echo "📧 support@cannaflow.com"
echo ""
print_success "Build process completed! Your APK is ready for pilot testing. 🚀"