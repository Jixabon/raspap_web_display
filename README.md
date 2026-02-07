# RaspAP Web Display

> Note: This project is in very early stages and all features may not be working. Looking forward to the first "offical" version.

A web interface for an integrated experience on a RaspAP device

This project was inspired by [RaspAP E-Paper Display Controller](https://github.com/id8872/raspap_display) and the other similar projects.

![Image of dashboard page with light theme](dashboard-light.png)
![Image of dashboard page with dark theme](dashboard-dark.png)

## Features

- Dashboard
    - AP QR Code and Info
    - Power Controls
    - Glanceable Interface/AP/Status Info
    - Quick Buttons
        - Connection
        - AP
        - VPN
        - Firewall
        - Settings
        - System Info
- Settings
    - Theme toggle
    - Theme schedule
    - Brightness control
    - Brightness schedule
- System Info
    - RaspAP Info
    - System Versions
    - System Metrics
    - Interfaces (Accordian)

## How's it work?

RaspAP Web Display uses the following tools to make an engaging experience

- NodeJS (Backend Server as well as front end static files)
- Preact (Quick and smooth front end templating)
- Weston (A desktop without the extras)
- Firefox (Gives us a browser to load the interface in kiosk mode)

It leverages the REST API included with RaspAP to gather the necessary data. While it is experimental, the approach is to have fallbacks on a version basis to fill in the gaps and shortcomings. Instead of creating the wheel twice, it's better to focus efforts on improving the API for everyone's benefit.

## Setup

> There's no install script yet so here are the steps to follow

Start by cloning the repository to your home directory (usually `/home/pi` or `~/`
```
cd ~/
git clone https://github.com/Jixabon/raspap_web_display.git
```

Add the NodeJS APT Repository
```
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
```

Install necessary apt packages
```
sudo apt update
sudo apt install \
  weston \
  firefox-esr \
  nodejs
```

Install server dependencies
```
npm install
```

Copy the `.env.example` and update the `RASPAP_API_KEY` with the key from your system
```
cp .env.example .env
nano .env
```

Copy the service file, enable, start and reboot
```
cp weston/weston.service /etc/systemd/system/weston.service
sudo systemctl enable weston.service
sudo systemctl start weston.service
```

## Development and Customization

RaspAP Web Display uses preact to generate a light and fast static "website" for the interface. To customize this you need to do a little setup.

```
cd html
npm install
```

From here you can use the npm scripts to server the site with `npm run dev`. This will auto refresh to make thigs easier. keep the main server running to maintain access to the RaspAP API. When you are done making it your own be sure to run `npm run build` as the main server uses the static files only.

## Hardware Support
As of right now the only hardware supported is what I have.
- Raspberry Pi 5 (8GB)
    - RaspAP installed by Raspberry Pi Imager
- Pimoroni HyperPixel 4.0