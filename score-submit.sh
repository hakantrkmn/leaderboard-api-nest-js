#!/bin/bash

# API base URL
API_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 Starting score submission script...${NC}"

# Function to generate random score between 50-200
generate_random_score() {
    echo $((RANDOM % 151 + 50))  # 50-200 arası
}

# Function to generate random player level
generate_random_level() {
    echo $((RANDOM % 50 + 1))  # 1-50 arası
}

# Function to generate random trophy count
generate_random_trophies() {
    echo $((RANDOM % 1000))  # 0-999 arası
}

# Function to login and get JWT token
login_user() {
    local username=$1
    local password="password123"

    local response=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"${username}\",
            \"password\": \"${password}\"
        }")

    # Extract token from response
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Function to submit score
submit_score() {
    local token=$1
    local score=$2
    local player_level=$3
    local trophy_count=$4

    local response=$(curl -s -X POST "${API_URL}/leaderboard/submit" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d "{
            \"score\": ${score},
            \"gameMode\": \"Classic\",
            \"playerLevel\": ${player_level},
            \"trophyCount\": ${trophy_count}
        }")

    echo "$response"
}

# Main score submission loop
success_count=0
error_count=0

# Read usernames from file or generate them
if [ -f "users.txt" ]; then
    echo -e "${GREEN}📖 Reading usernames from users.txt...${NC}"
    usernames=$(tail -n +2 users.txt | cut -d',' -f1)  # Skip header
else
    echo -e "${GREEN}📝 Generating usernames...${NC}"
    usernames=$(for i in {1..100}; do echo "user${i}"; done)
fi

for username in $usernames; do
    echo -n "Submitting score for ${username}... "

    # Login and get token
    token=$(login_user "$username")

    if [ -z "$token" ]; then
        echo -e "${RED}❌ Login failed${NC}"
        ((error_count++))
        continue
    fi

    # Generate random data
    score=$(generate_random_score)
    player_level=$(generate_random_level)
    trophy_count=$(generate_random_trophies)

    # Submit score
    response=$(submit_score "$token" "$score" "$player_level" "$trophy_count")

    # Check if submission was successful
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Success (Score: ${score}, Mode: Classic)${NC}"
        ((success_count++))
    else
        echo -e "${RED}❌ Failed${NC}"
        echo "Error: $response"
        ((error_count++))
    fi

    # Small delay to avoid overwhelming the server
    sleep 0.2
done

echo ""
echo -e "${GREEN}🎉 Score submission completed!${NC}"
echo -e "✅ Successful submissions: ${success_count}"
echo -e "❌ Failed submissions: ${error_count}"
echo -e "📊 Total attempts: $((success_count + error_count))"
