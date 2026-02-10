# FAQ

## What to do if I installed with Weston?

Not a problem! The install script is not set to remove Weston since this was a shift early on so to remove Weston run the following:

```bash
sudo systemctl stop weston.service
sudo systemctl disable weston.service
sudo rm /etc/systemd/system/weston.service
sudo apt remove weston
```

After that, run the install script again.

## Why Chromium?

A lot of time has gone into trying to keep resources down as much as possible to let RaspAP have as much as it needs and not cause conflicts. Unfortunately, due to limitations Chromium is a necessity for the ability to open web pages as an “app” with zero browser interface for that integrated look. Note that this is not fullscreen or kiosk mode. The reason for avoiding fullscreen and kiosk mode is because of issues with the on-screen keyboard (OSK). The OSK used is Squeekboard. When an app is fullscreen it’s shown on a layer above the layer that the OSK is shown on. The work around is to either maximize the Chromium window with minimal UI or manually patch and build a version of squeekboard that uses a higher layer than fullscreen. For ease of support and installation, the maximized window route has been chosen.

A lot of browsers have been looked at and it's possible something has been overlooked. If you have an idea that something else might work the same and use less resources, create an issue.

<!-- ## I have a different user than pi

That's perfectly fine, run the install script using `--user=pi` but with your user name instead. This will set up everything necessary. One more thing, make sure that auto-login is enabled for your user via the `raspi-config` -->