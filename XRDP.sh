#!/bin/bash

# update
sudo apt update && sudo apt upgrade -y

# root
if [ "$(id -u)" != "0" ]; then
    echo "This script must be run as root or using sudo."
    exit 1
fi

# port
echo "Opening required ports..."
sudo ufw allow 22 comment 'Allow SSH'
sudo ufw allow 3389 comment 'Allow RDP'
sudo ufw reload
echo "Port 22 remains open for SSH. Port 3389 opened for RDP."

# xfce
echo "Installing XFCE..."
sudo apt update
sudo apt install xfce4 xfce4-goodies -y
if [ $? -eq 0 ]; then
    echo "XFCE successfully installed."
else
    echo "Failed to install XFCE. Check internet connection or repository."
    exit 1
fi

# ldm
echo "Installing LightDM..."
sudo apt install lightdm -y
if [ $? -eq 0 ]; then
    echo "LightDM successfully installed."
else
    echo "Failed to install LightDM. Check internet connection or repository."
    exit 1
fi

echo "Setting LightDM as the default display manager..."
sudo systemctl enable lightdm
sudo systemctl start lightdm

# xrdp
echo "Installing XRDP for Remote Desktop access..."
sudo apt install xrdp -y
if [ $? -eq 0 ]; then
    echo "XRDP successfully installed."
else
    echo "Failed to install XRDP. Check internet connection or repository."
    exit 1
fi

echo "Configuring XRDP to use XFCE..."
echo xfce4-session >~/.xsession
sudo systemctl enable xrdp
sudo systemctl restart xrdp
sudo adduser xrdp ssl-cert
echo "XRDP Status:"
sudo systemctl status xrdp --no-pager

# firewall
echo "Displaying firewall status..."
sudo ufw status verbose

echo "Setup complete! You can now access the server via Remote Desktop Connection using this server's IP."

# docker
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do 
    sudo apt-get remove -y $pkg
done

sudo apt-get update
sudo apt-get install -y ca-certificates curl

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc

sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
