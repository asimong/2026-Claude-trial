#!/bin/bash

# RegenCHOICE Question Manager - Deployment Script
# This script automates deployment to your web server

# Configuration - Update these variables for your server
SERVER_USER="your-username"
SERVER_HOST="www.simongrant.org"
SERVER_PATH="/path/to/web/directory"  # e.g., /var/www/html/regenchoice

# Files to deploy (excludes git files, this script, etc.)
FILES_TO_DEPLOY=(
  "index.html"
  "app.js"
  "question-data.js"
  "styles.css"
  "api.php"
  "README.md"
)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RegenCHOICE Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Method 1: Using rsync (recommended)
echo -e "${GREEN}Deployment method: rsync${NC}"
echo "Deploying to: $SERVER_USER@$SERVER_HOST:$SERVER_PATH"
echo ""

# Create data directory on server if it doesn't exist
echo "Creating data directory on server..."
ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p $SERVER_PATH/data && chmod 755 $SERVER_PATH/data"

# Deploy files using rsync
echo "Uploading files..."
rsync -avz --progress \
  --include='*.html' \
  --include='*.js' \
  --include='*.css' \
  --include='*.php' \
  --include='*.md' \
  --exclude='.*' \
  --exclude='deploy.sh' \
  --exclude='data/' \
  --exclude='node_modules/' \
  ./ "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Deployment successful!${NC}"
  echo ""
  echo "Set permissions for data directory..."
  ssh "$SERVER_USER@$SERVER_HOST" "chmod 755 $SERVER_PATH/data && chmod 666 $SERVER_PATH/data/questions.json 2>/dev/null || true"
  echo -e "${GREEN}✓ Permissions updated${NC}"
  echo ""
  echo -e "${GREEN}Your application is now live at:${NC}"
  echo -e "${BLUE}https://$SERVER_HOST/regenchoice/${NC}"
else
  echo -e "${RED}✗ Deployment failed!${NC}"
  exit 1
fi

# Alternative Method 2: Using git (if server has git installed)
# Uncomment the section below to use git-based deployment instead

# echo -e "${GREEN}Alternative: Git-based deployment${NC}"
# echo "1. On your server, clone the repository:"
# echo "   cd $SERVER_PATH"
# echo "   git clone https://github.com/yourusername/yourrepo.git ."
# echo ""
# echo "2. To update, SSH to server and run:"
# echo "   cd $SERVER_PATH"
# echo "   git pull origin main"
# echo ""
# echo "3. Or automate with a webhook or cron job"
