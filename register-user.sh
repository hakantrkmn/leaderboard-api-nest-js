#!/bin/bash

# API base URL
API_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting user registration script...${NC}"

# Function to generate random device ID
generate_device_id() {
    echo "device_$(printf "%08x" $((RANDOM * RANDOM)))"
}

# Function to register a user
register_user() {
    local username=$1
    local password="password123"
    local device_id=$2

    local response=$(curl -s -X POST "${API_URL}/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"${username}\",
            \"password\": \"${password}\",
            \"deviceId\": \"${device_id}\"
        }")

    echo "$response"
}

# Main registration loop
success_count=0
error_count=0

for i in {1..100}; do
    username="user${i}"
    device_id=$(generate_device_id)

    echo -n "Registering user ${i}/100: ${username}... "

    response=$(register_user "$username" "$device_id")

    # Check if registration was successful
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Success${NC}"
        ((success_count++))
    else
        echo -e "${RED}❌ Failed${NC}"
        echo "Error: $response"
        ((error_count++))
    fi

    # Small delay to avoid overwhelming the server
    sleep 0.1
done

echo ""
echo -e "${GREEN}🎉 Registration completed!${NC}"
echo -e "✅ Successful registrations: ${success_count}"
echo -e "❌ Failed registrations: ${error_count}"
echo -e "📊 Total attempts: $((success_count + error_count))"

# Save usernames to file for later use
echo ""
echo -e "${GREEN}💾 Saving usernames to users.txt...${NC}"
echo "username,password,device_id" > users.txt
for i in {1..100}; do
    username="user${i}"
    device_id=$(generate_device_id)
    echo "${username},password123,${device_id}" >> users.txt
done
echo -e "${GREEN}✅ Usernames saved to users.txt${NC}"
