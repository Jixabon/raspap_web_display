import util from 'node:util';
import child_process from 'child_process';
const exec = util.promisify(child_process.exec);

import { cleanOutput } from './utils.js'

// System
export async function getRaspAPVersion() {
    const {stdout, stderr} = await exec("grep 'RASPI_VERSION' /var/www/html/includes/defaults.php | awk -F\"'\" '{print $4}'");
    
    if (stderr) {
        console.error(stderr);
        return;
    }

    return cleanOutput(stdout);
}

export async function getUsedDisk() {
    const {stdout, stderr} = await exec("df -h / | awk 'NR==2 {print $5}' | sed 's/%$//'");
    
    if (stderr) {
        console.error(stderr);
        return;
    }

    return cleanOutput(stdout);
}

// AP
export async function getAPInterface() {
    const {stdout, stderr} = await exec("cat /etc/hostapd/hostapd.conf | grep '^interface=' | cut -d'=' -f2");

    if (stderr) {
        console.error(stderr);
        return;
    }

    return cleanOutput(stdout);
}

export async function getFrequencyBand(intrfc) {
    const {stdout, stderr} = await exec(`iw dev ${intrfc} info 2>/dev/null`);
    
    if (stderr) {
        console.error(stderr);
        return;
    }

    let matches = (stdout || "").match(/channel\s+\d+\s+\((\d+)\s+MHz\)/);

    if (matches) {
        let frequency = Number.parseInt(matches[1]);

        if (frequency >= 2400 && frequency < 2500) {
            return "2.4";
        } else if (frequency >= 5000 && frequency < 6000) {
            return "5";
        }
        return null;
    }
}

export async function getWPAPassphrase() {
    const {stdout, stderr} = await exec("sed -En 's/wpa_passphrase=(.*)/\\1/p' /etc/hostapd/hostapd.conf");
    
    if (stderr) {
        console.error(stderr);
        return;
    }

    return cleanOutput(stdout);
}

// Clients
async function getWirelessClientsMac(intrfc) {
    const {stdout, stderr} = await exec(`iw dev ${intrfc} station dump`);
    
    if (stderr) {
        console.error(stderr);
        return [];
    }

    // Match lines that start with "Station " followed by a MAC address
    const macRegex = /^Station\s+([0-9a-fA-F]{2}(?::[0-9a-fA-F]{2}){5})/gm;
    
    const macAddresses = [];
    let match;
    
    while ((match = macRegex.exec(stdout)) !== null) {
        let mac = match[1];
        macAddresses.push(mac.toUpperCase());
    }

    return macAddresses;
}

export async function getWirelessClientsAmount() {
    let apInterface = await getAPInterface();
    let wirelessMacs = await getWirelessClientsMac(apInterface);

    return (wirelessMacs || []).length;
}

async function getEthernetClientsMac() {
    const arpRes = await exec(`ip neigh show`);
    
    if (arpRes.stderr) {
        console.error(arpRes.stderr);
        return [];
    }
    
    const arpRegex = /^(\S+)\s+dev\s+(eth[0-9]+|en\w+)\s+lladdr\s+(\S+)\s+(REACHABLE|DELAY|PROBE)/gm;
    
    let arpMacs = [];
    let match;
    
    while ((match = arpRegex.exec(arpRes.stdout)) !== null) {
        let mac = match[1];
        arpMacs.push(mac.toUpperCase());
    }

    const leasesRes = await exec(`cat ${process.env.RASPI_DNSMASQ_LEASES}`);

    if (leasesRes.stderr) {
        console.error(leasesRes.stderr);
        return [];
    }

    let leaseMacs = [];
    const leasesLines = leasesRes.stdout.split(/\r?\n/);

    for (const line of leasesLines) {
        if (!line || line.split()[0] === '#') continue;

        let fields = line.split(' ');
        if (fields.length >= 3) {
            let mac = fields[1];
            leaseMacs.push(mac.toUpperCase());
        }
    }

    let activeEthernetMacs = [];
    for (const mac of arpMacs) {
        if (leaseMacs.includes(mac) && !activeEthernetMacs.includes(mac)) {
            activeEthernetMacs.push(mac);
        }
    }

    return activeEthernetMacs;
}

export async function getEthernetClientsAmount() {
    let ethernetMacs = await getEthernetClientsMac();

    return (ethernetMacs || []).length;
}

export async function getActiveClients() {
    let apInterface = await getAPInterface();
    let wirelessMacs = await getWirelessClientsMac(apInterface);
    let ethernetMacs = await getEthernetClientsMac();

    const arpRes = await exec(`arp -i ${apInterface}`);

     if (arpRes.stderr) {
        console.error(arpRes.stderr);
        return [];
    }

    const arpLines = arpRes.stdout.split(/\r?\n/);
    arpLines.shift(); // remove header line

    let arpMacAddresses = arpLines.reduce((arpMacAddress, line) => {
        let parts = line.split(/\s+/);
        if (parts.length > 3) {
            arpMacAddress.push(parts[2]);
        }

        return arpMacAddress;
    }, []);

    const leasesRes = await exec(`cat ${process.env.RASPI_DNSMASQ_LEASES}`);

    if (leasesRes.stderr) {
        console.error(leasesRes.stderr);
        return [];
    }

    const leasesLines = leasesRes.stdout.split(/\r?\n/);

    let activeClients = [];

    for (const line of leasesLines) {
        let fields = line.split(' ');
        if (fields.length >= 3) {
            let macAddress = fields[1];

            if (arpMacAddresses.includes(macAddress)) {
                let normalizedMac = macAddress.toUpperCase();
                let isWireless = wirelessMacs.includes(normalizedMac);
                let isEthernet = ethernetMacs.includes(normalizedMac);

                let clientData = {
                    "timestamp": parseInt(fields[0]),
                    "mac_address": fields[1],
                    "ip_address": fields[2],
                    "hostname": fields[3],
                    "client_id": fields[4],
                    "connection_type": isWireless ? 'wireless' : isEthernet ? 'ethernet' : 'unknown'
                }
                activeClients.push(clientData);
            }
        }
    }

    return activeClients;
}

// WiFi Client
export async function getConnectedWiFiClient(intrfc) {
    const {stdout, stderr} = await exec(`iw dev ${intrfc} link`);
    
    if (stderr) {
        console.error(stderr);
        return null;
    }

    let ssidMatch = stdout.match(/SSID:\s+(.*)/);
    // let channelMatch = stdout.match(/channel\s+(\d+)/);
    let rssiMatch = stdout.match(/signal:\s+(-\d+)/);
    let securityMatch = stdout.match(/RSN:\s+((?:\w+\s*)+)/);

    if (ssidMatch && rssiMatch) {
        return {
            ssid: ssidMatch[1].trim(),
            // channel: parseInt(channelMatch[1]),
            RSSI: rssiMatch[1].trim(),
            security: securityMatch ? securityMatch[1].trim() : 'Unknown'
        };
    } else {
        return null;
    }
}