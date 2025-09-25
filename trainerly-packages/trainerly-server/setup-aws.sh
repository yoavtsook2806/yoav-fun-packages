#!/bin/bash

echo "🚀 Matan Trainings Server - AWS Setup"
echo "====================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    echo "📥 Installing AWS CLI..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
        sudo installer -pkg AWSCLIV2.pkg -target /
        rm AWSCLIV2.pkg
    else
        # Linux
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        sudo ./aws/install
        rm -rf aws awscliv2.zip
    fi
fi

# Check if Serverless is installed
if ! command -v serverless &> /dev/null; then
    echo "❌ Serverless Framework is not installed"
    echo "📥 Installing Serverless Framework..."
    npm install -g serverless
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS credentials are configured"
    aws sts get-caller-identity
else
    echo "❌ AWS credentials not configured"
    echo "🔧 Please configure AWS credentials:"
    echo ""
    echo "1. Go to AWS Console: https://console.aws.amazon.com"
    echo "2. Navigate to IAM > Users > Your User > Security credentials"
    echo "3. Create Access Key if you don't have one"
    echo "4. Run: aws configure"
    echo ""
    echo "You'll need:"
    echo "- AWS Access Key ID"
    echo "- AWS Secret Access Key" 
    echo "- Default region (e.g., us-east-1)"
    echo ""
    read -p "Press Enter after configuring AWS credentials..."
    
    if aws sts get-caller-identity &> /dev/null; then
        echo "✅ AWS credentials configured successfully!"
    else
        echo "❌ AWS credentials still not working. Please check your configuration."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Deploy to development
echo "🚀 Deploying to AWS (development environment)..."
echo "This will create:"
echo "- 3 DynamoDB tables"
echo "- 4 Lambda functions" 
echo "- 1 API Gateway"
echo ""
read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    yarn deploy:dev
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Deployment successful!"
        echo "📡 Your API is now live!"
        echo ""
        echo "Next steps:"
        echo "1. Test your API endpoints (see README.md)"
        echo "2. Populate training plans in DynamoDB"
        echo "3. Update your frontend to use the real API"
        echo ""
        echo "📊 Monitor your deployment:"
        echo "- AWS Console: https://console.aws.amazon.com"
        echo "- CloudWatch Logs for debugging"
        echo "- DynamoDB for data management"
    else
        echo "❌ Deployment failed. Check the error messages above."
        exit 1
    fi
else
    echo "Deployment cancelled."
fi

echo ""
echo "✨ Setup complete!"
