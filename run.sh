#!/bin/bash

echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Failed to install dependencies"
    read -p "Press any key to continue..."
    exit 1
fi

echo "Starting manga scraper..."
node index.js

read -p "Press any key to continue..."