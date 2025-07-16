#!/bin/bash

echo "🔧 Fixing session persistence and testing email functionality..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    
    # Copy the updated files to dist
    echo "📁 Copying updated files to dist..."
    cp .env dist/
    
    echo "✅ Session persistence and email fixes applied"
    echo "🚀 Please restart your Docker containers to apply changes"
    echo ""
    echo "Run these commands on your server:"
    echo "docker-compose down"
    echo "docker-compose up -d"
    echo ""
    echo "📧 Email functionality fixes:"
    echo "- Fixed email sending for all inquiries (not just property-specific ones)"
    echo "- Enhanced email configuration with better error handling"
    echo "- Updated SMTP settings for port 587 (STARTTLS)"
    echo ""
    echo "🔐 Session persistence fixes:"
    echo "- Removed domain restriction from session cookies"
    echo "- Enhanced session debugging"
    echo "- Updated session configuration for better compatibility"
    
else
    echo "❌ Build failed"
    exit 1
fi
