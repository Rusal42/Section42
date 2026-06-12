#!/bin/bash
# Section42 Bot - Chromebook SSH Setup Script
# Run this on your Chromebook Linux terminal

echo "================================"
echo "Section42 Bot - Chromebook Setup"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/5] Checking for existing SSH key...${NC}"

if [ -f ~/.ssh/id_ed25519 ]; then
    echo -e "${GREEN}SSH key already exists!${NC}"
    echo -e "${CYAN}Your public key:${NC}"
    cat ~/.ssh/id_ed25519.pub
    echo ""
    read -p "Generate a new key anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipping key generation...${NC}"
    else
        echo -e "${YELLOW}Generating new SSH key...${NC}"
        read -p "Enter your email: " email
        ssh-keygen -t ed25519 -C "$email"
        echo -e "${GREEN}New key generated!${NC}"
    fi
else
    echo -e "${YELLOW}No SSH key found. Generating one...${NC}"
    read -p "Enter your email: " email
    ssh-keygen -t ed25519 -C "$email"
    echo -e "${GREEN}SSH key generated!${NC}"
fi

echo ""
echo -e "${YELLOW}[2/5] Your public key (copy this):${NC}"
echo -e "${CYAN}================================${NC}"
cat ~/.ssh/id_ed25519.pub
echo -e "${CYAN}================================${NC}"
echo ""

read -p "Press Enter after you've copied the key..."

echo ""
echo -e "${YELLOW}[3/5] Configuring Git...${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed!${NC}"
    echo -e "${YELLOW}Installing git...${NC}"
    sudo apt update
    sudo apt install -y git
    echo -e "${GREEN}Git installed!${NC}"
else
    echo -e "${GREEN}Git is already installed!${NC}"
fi

echo ""
echo -e "${YELLOW}[4/5] Setting up Git remote...${NC}"

read -p "Are you using GitHub? (Y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Nn]$ ]]; then
    # Direct PC connection
    read -p "Enter your PC's IP address (e.g., 192.168.1.100): " pc_ip
    read -p "Enter your PC username (e.g., adens): " pc_user
    read -p "Enter the full path to your repo on PC (e.g., /c/Users/adens/Downloads/Bots/Section42): " repo_path
    
    git_url="$pc_user@$pc_ip:$repo_path"
    
    echo -e "${YELLOW}Testing SSH connection to PC...${NC}"
    ssh -o StrictHostKeyChecking=no "$pc_user@$pc_ip" "echo 'Connection successful!'"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}SSH connection successful!${NC}"
    else
        echo -e "${RED}SSH connection failed. Make sure:${NC}"
        echo "1. SSH server is running on PC"
        echo "2. Your public key is in PC's authorized_keys"
        echo "3. IP address is correct"
    fi
else
    # GitHub connection
    read -p "Enter your GitHub username: " github_user
    read -p "Enter your repository name (e.g., Section42): " repo_name
    
    git_url="git@github.com:$github_user/$repo_name.git"
    
    echo -e "${YELLOW}Testing GitHub SSH connection...${NC}"
    ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}GitHub SSH connection successful!${NC}"
    else
        echo -e "${YELLOW}Testing connection...${NC}"
        ssh -T git@github.com
    fi
fi

echo ""
echo -e "${YELLOW}[5/5] Updating Git remote...${NC}"

# Check if we're in a git repository
if [ -d .git ]; then
    echo -e "${GREEN}Git repository detected!${NC}"
    
    # Update or add remote
    if git remote get-url origin &> /dev/null; then
        echo -e "${YELLOW}Updating existing remote...${NC}"
        git remote set-url origin "$git_url"
    else
        echo -e "${YELLOW}Adding new remote...${NC}"
        git remote add origin "$git_url"
    fi
    
    echo -e "${GREEN}Remote configured!${NC}"
    echo ""
    echo -e "${CYAN}Current remote:${NC}"
    git remote -v
else
    echo -e "${RED}Not in a git repository!${NC}"
    echo -e "${YELLOW}Navigate to your Section42 folder and run this script again.${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "================================"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "1. Make sure your public key is added to:"
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "   - PC: C:\\Users\\$pc_user\\.ssh\\authorized_keys"
else
    echo "   - GitHub: Settings → SSH and GPG keys"
fi
echo "2. Test with: git push origin main"
echo ""
echo -e "${GREEN}You should now be able to push without passwords!${NC}"
echo ""
