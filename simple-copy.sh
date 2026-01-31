#!/bin/bash

# Simple script to copy web files to an easy location

echo "Where would you like to copy the files?"
echo "Examples: ~/Desktop, ~/Downloads, /tmp/regenchoice"
read -p "Destination folder: " DEST

# Create destination folder
mkdir -p "$DEST"

# Copy the essential files
echo "Copying files to $DEST..."
cp index.html "$DEST/"
cp app.js "$DEST/"
cp question-data.js "$DEST/"
cp styles.css "$DEST/"
cp api.php "$DEST/"
cp README.md "$DEST/"
cp UPLOAD-GUIDE.txt "$DEST/"

echo ""
echo "✓ Done! Files copied to: $DEST"
echo ""
echo "Files you need to upload to your server:"
ls -lh "$DEST"/*.{html,js,css,php,md,txt} 2>/dev/null
echo ""
echo "Next step: Upload these files to www.simongrant.org using FTP/SFTP"
