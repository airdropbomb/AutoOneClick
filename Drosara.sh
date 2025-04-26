#!/bin/bash

# Define color codes
INFO='\033[0;36m'   # Cyan
BANNER='\033[0;35m' # Magenta
YELLOW='\033[0;33m' # Yellow
RED='\033[0;31m'    # Red
GREEN='\033[0;32m'  # Green
BLUE='\033[0;34m'   # Blue
NC='\033[0m'        # No Color

# Simple log function
show() {
    case "$2" in
        "error") echo -e "${RED}[ERROR]${NC} $1" ;;
        "progress") echo -e "${BLUE}[...]${NC} $1" ;;
        "success") echo -e "${GREEN}[OK]${NC} $1" ;;
        *) echo -e "${YELLOW}[INFO]${NC} $1" ;;
    esac
}

# Banner
echo -e "${YELLOW}========================================"
echo -e " Script is made by ADB NODE"
echo -e "----------------------------------------${NC}"
echo -e '\e[34m'
cat << "EOF"
 █████╗ ██████╗ ██████╗     ███╗   ██╗ ██████╗ ██████╗ ███████╗
██╔══██╗██╔══██╗██╔══██╗    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝
███████║██║  ██║██████╔╝    ██╔██╗ ██║██║   ██║██║  ██║█████╗
██╔══██║██║  ██║██╔══██╗    ██║╚██╗██║██║   ██║██║  ██║██╔══╝
██║  ██║██████╔╝██████╔╝    ██║ ╚████║╚██████╔╝██████╔╝███████╗
╚═╝  ╚═╝╚═════╝ ╚═════╝     ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝
EOF
echo -e '\e[0m'
echo -e "======================================================="
echo -e "${YELLOW}Telegram: ${GREEN}https://t.me/airdropbombnode${NC}"
echo -e "${YELLOW}Twitter: ${GREEN}@airdropbombnode${NC}"
echo -e "${YELLOW}YouTube: ${GREEN}https://www.youtube.com/@airdropbombnode${NC}"
echo -e "${YELLOW}Medium: ${INFO}https://medium.com/@airdropbomb${NC}"
echo -e "======================================================="

# Update system
show "Updating system packages..." "progress"
sudo apt update -y && sudo apt upgrade -y

# Install essential dependencies
show "Installing required dependencies..." "progress"
sudo apt install curl ufw iptables build-essential git wget lz4 jq make gcc nano automake autoconf tmux htop nvme-cli libgbm1 pkg-config libssl-dev libleveldb-dev tar clang bsdmainutils ncdu unzip screen -y

# Install Docker
if ! command -v docker &>/dev/null; then
    show "Installing Docker..." "progress"
    sudo apt install -y apt-transport-https ca-certificates software-properties-common lsb-release gnupg2
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update -y
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    show "Docker installed." "success"
else
    show "Docker is already installed." "success"
fi

# Docker Compose
if ! command -v docker-compose &>/dev/null; then
    show "Installing Docker Compose..." "progress"
    VER=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
    sudo curl -L "https://github.com/docker/compose/releases/download/$VER/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    show "Docker Compose installed." "success"
else
    show "Docker Compose is already installed." "success"
fi

# Add user to Docker group
if ! groups $USER | grep -q '\bdocker\b'; then
    show "Adding user to Docker group..."
    sudo usermod -aG docker $USER
    show "You may need to logout/login or reboot to apply group changes." "info"
else
    show "User is already in the Docker group." "success"
fi

# Install Node.js (latest)
show "Fetching latest Node.js version..." "progress"
LATEST_VERSION=$(curl -s https://nodejs.org/dist/latest/ | grep -oP 'node-v\K\d+\.\d+\.\d+' | head -1)
MAJOR_VERSION=$(echo $LATEST_VERSION | cut -d. -f1)
curl -sL https://deb.nodesource.com/setup_${MAJOR_VERSION}.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    show "Node.js $NODE_VERSION and npm $NPM_VERSION installed." "success"
else
    show "Node.js or npm not installed correctly!" "error"
    exit 1
fi

# Drosera Operator installation
show "Downloading and extracting Drosera Operator..." "progress"
cd ~ && curl -LO https://github.com/drosera-network/releases/releases/download/v1.16.2/drosera-operator-v1.16.2-x86_64-unknown-linux-gnu.tar.gz && \
tar -xvf drosera-operator-v1.16.2-x86_64-unknown-linux-gnu.tar.gz && \
rm drosera-operator-v1.16.2-x86_64-unknown-linux-gnu.tar.gz

show "Drosera Operator installed in home directory." "success"

# Done!
echo -e "${YELLOW}----------------------------------------"
echo -e " ✅ All setup steps completed!"
echo -e "----------------------------------------${NC}"
