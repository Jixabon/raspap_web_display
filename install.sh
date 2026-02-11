#!/bin/bash

# Add NodeJS LTS Repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Install APT Dependencies
sudo apt update
sudo apt install \
  labwc \
  swayidle \
  wlopm \
  swaybg \
  squeekboard \
  chromium \
  nodejs

# Install NodeJS Dependencies for Server
npm install

# Copy ENV Example
cp .env.example .env

# Enable linger for user
sudo loginctl enable-linger pi

# Install, Enable, Start backend server
sudo cp raspap-web.service /etc/systemd/system/raspap-web.service
sudo systemctl enable raspap-web.service
sudo systemctl start raspap-web.service

# Install, Enable Kiosk Service
# Note: the traditional location for Labwc's config is ~/.config/labwc
# but setting a different directory within the git cloned dir for ease of updates
sudo cp labwc/raspap-labwc.service /etc/systemd/system/raspap-labwc.service
sudo systemctl enable raspap-labwc.service