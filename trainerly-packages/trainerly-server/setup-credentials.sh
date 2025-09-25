#!/bin/bash

echo "🔐 AWS Credentials Setup"
echo "======================"
echo ""
echo "First, get your AWS Access Keys:"
echo "1. In AWS Console, click 'Create access key' (you're already there!)"
echo "2. Choose 'Command Line Interface (CLI)'"
echo "3. Copy the Access Key ID and Secret Access Key"
echo ""

read -p "Enter your AWS Access Key ID: " ACCESS_KEY
read -p "Enter your AWS Secret Access Key: " SECRET_KEY
read -p "Enter your preferred AWS Region (default: us-east-1): " REGION

# Set default region if not provided
if [ -z "$REGION" ]; then
    REGION="us-east-1"
fi

echo ""
echo "🔧 Configuring AWS CLI..."

# Set up AWS credentials using environment variables
export AWS_ACCESS_KEY_ID="$ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$SECRET_KEY"
export AWS_DEFAULT_REGION="$REGION"

# Also configure the AWS CLI profile
aws configure set aws_access_key_id "$ACCESS_KEY"
aws configure set aws_secret_access_key "$SECRET_KEY"
aws configure set default.region "$REGION"
aws configure set default.output "json"

echo "✅ AWS credentials configured!"
echo ""

# Test the configuration
echo "🧪 Testing AWS connection..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✅ AWS connection successful!"
    echo ""
    echo "Your AWS Account:"
    aws sts get-caller-identity
    echo ""
    
    echo "🚀 Ready to deploy your server!"
    echo "Run: yarn deploy:dev"
else
    echo "❌ AWS connection failed. Please check your credentials."
    exit 1
fi
