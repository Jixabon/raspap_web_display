import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'node:util';
import child_process from 'child_process';
import qrcode from 'qrcode';

import * as fallbacks from './fallbacks.js';
import { cleanOutput, versionCompare } from './utils.js';

const exec = util.promisify(child_process.exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var ENDPOINT_CACHE = {
  system: {},
  ap: {},
  clients: {},
  dhcp: {},
  networking: {},
};

const app = express();
app.use(express.json());

async function fetch_api(path, method = 'GET') {
  const response = await fetch(`${process.env.RASPAP_API_URL}${path}`, {
      method: method,
      headers: {
          "accept": "application/json",
          "access_token": `${process.env.RASPAP_API_KEY || 'insecure'}`
      }
  });

  return response;
}

async function refreshCache(endpoints, clientsInterface = 'wlan0') {
  // @TODO add catches
  if (endpoints.includes('system')) {
    const res_system = await fetch_api('/system');
    ENDPOINT_CACHE.system = await res_system.json();
  }
  if (endpoints.includes('ap')) {
    const res_ap = await fetch_api('/ap');
    let ap_json = await res_ap.json();
    ENDPOINT_CACHE.ap = ap_json;
  }
  if (endpoints.includes('clients')) {
    const res_clients = await fetch_api(`/clients/${clientsInterface}`);
    ENDPOINT_CACHE.clients[clientsInterface] = await res_clients.json();
  }
  if (endpoints.includes('dhcp')) {
    const res_dhcp = await fetch_api('/dhcp');
    ENDPOINT_CACHE.dhcp = await res_dhcp.json();
  }
  if (endpoints.includes('networking')) {
    const res_networking = await fetch_api('/networking');
    ENDPOINT_CACHE.networking = await res_networking.json();
  }

  // Get API version to know what datapoints need to use fallbacks
  let raspap_version = await fallbacks.getRaspAPVersion();

  // API version fallbacks
  if (raspap_version === '3.5.2') {
    if (endpoints.includes('system')) {
      ENDPOINT_CACHE.system.raspapVersion = await fallbacks.getRaspAPVersion();
      ENDPOINT_CACHE.system.usedDisk = await fallbacks.getUsedDisk();
    }

    if (endpoints.includes('ap')) {
      ENDPOINT_CACHE.ap.interface = await fallbacks.getAPInterface();
      ENDPOINT_CACHE.ap.frequency_band = await fallbacks.getFrequencyBand(clientsInterface);
      ENDPOINT_CACHE.ap.wpa_passphrase = await fallbacks.getWPAPassphrase();
    }

    if (endpoints.includes('clients')) {
      let wirelessClients = await fallbacks.getWirelessClients(clientsInterface);
      ENDPOINT_CACHE.clients[clientsInterface].active_wireless_clients = wirelessClients;
      // ENDPOINT_CACHE.clients[clientsInterface].ethernetClients = await fallbacks.getEthernetClients();
      ENDPOINT_CACHE.clients[clientsInterface].active_clients_amount = wirelessClients;
    }
  }

  // console.log(ENDPOINT_CACHE);
}

async function getConnectionInterface() {
  const { stdout, stderr } = await exec("ip route show default | awk 'NR==1 {print $5}'");
    let intrfc = stdout.trim();

    if (intrfc == "" || stderr) {
	    return null;
	  }

    return intrfc;
}

function getConnectionType(intrfc) {
    if (intrfc == "" || intrfc == null) {
	    return 'unknown';
	  }
	  // classify interface type
	  if (/^eth0|enp\d+s\d+|ens\d+s\d+|enx[0-9a-f]*/.test(intrfc)) {
		  return 'ethernet';
		}
		if (/^wlan\d+|wlp\d+s\d+|wlx[0-9a-f]*/.test(intrfc)) {
			return 'wireless';
		}
		if (/^usb\d+|^eth[1-9]\d*/.test(intrfc)) {
			return 'tethering';
		}
		if (/^ppp\d+|wwan\d+|wwp\d+s\d+/.test(intrfc)) {
			return 'cellular';
		}
    // if none match, return the interface name as a fallback
    return `other (${intrfc})`;
}

app.get("/api/dashboard", async (req, res) => {
  let clientsInterface = ENDPOINT_CACHE.ap.interface || 'wlan0';
  await refreshCache(['system', 'ap', 'clients', 'networking'], clientsInterface);

  let connectionInterface = await getConnectionInterface();
  let connectionType = getConnectionType(connectionInterface);

  let payload = {
		connection: {
			type: connectionType,
			ssid: connectionType == 'wireless' ? 'ssid' : null,
			interface: connectionInterface,
			ipv4: ENDPOINT_CACHE.networking.interfaces[connectionInterface]?.IP_address,
		},
		revision: ENDPOINT_CACHE.system.rpiRevision,
		hostname: ENDPOINT_CACHE.system.hostname,
		host: {
			ssid: ENDPOINT_CACHE.ap.ssid,
      passphrase: ENDPOINT_CACHE.ap.wpa_passphrase,
			interface: ENDPOINT_CACHE.ap.interface,
			ipv4: ENDPOINT_CACHE.networking.interfaces[ENDPOINT_CACHE.ap.interface]?.IP_address,
			clients_count: ENDPOINT_CACHE.clients[ENDPOINT_CACHE.ap.interface].active_clients_amount,
      hide_ssid: ENDPOINT_CACHE.ap.ignore_broadcast_ssid == '0' ? false : true
		},

		statuses: {
			ap_enabled: true,
			ap_active: !!ENDPOINT_CACHE.system.hostapdStatus,
			bridged_enabled: true,
			bridged_active: false,
			ad_block_enabled: true,
			ad_block_active: true,
			vpn_enabled: true,
			vpn_active: false,
			firewall_enabled: false,
			firewall_active: false,
		},

    version: ENDPOINT_CACHE.system.raspapVersion,
		uptime: ENDPOINT_CACHE.system.uptime,
	};
  
  res.json(payload);
});

app.get("/api/ap", async (req, res) => {
  await refreshCache(['ap', 'dhcp', 'networking', 'clients'], ENDPOINT_CACHE.ap.interface || 'wlan0');

  let payload = {
    interface: ENDPOINT_CACHE.ap.interface,
    ssid: ENDPOINT_CACHE.ap.ssid,
    hide_ssid: ENDPOINT_CACHE.ap.ignore_broadcast_ssid == '0' ? false : true,
    wpa_key_mgmt: ENDPOINT_CACHE.ap.wpa_key_mgmt,
    wpa: ENDPOINT_CACHE.ap.wpa,
    passphrase: ENDPOINT_CACHE.ap.wpa_passphrase,
    frequency_band: ENDPOINT_CACHE.ap.frequency_band,
    channel: ENDPOINT_CACHE.ap.channel,
    hw_mode: ENDPOINT_CACHE.ap.hw_mode,
    ipv4: ENDPOINT_CACHE.networking.interfaces[ENDPOINT_CACHE.ap.interface]?.IP_address,
    dhcp: {
      range_start: ENDPOINT_CACHE.dhcp.range_start,
      range_end: ENDPOINT_CACHE.dhcp.range_end,
      range_subnet_mask: ENDPOINT_CACHE.dhcp.range_subnet_mask,
      range_lease_time: ENDPOINT_CACHE.dhcp.range_lease_time,
      range_gateway: ENDPOINT_CACHE.dhcp.range_gateway,
      range_nameservers: ENDPOINT_CACHE.dhcp.range_nameservers
    },
    wireless_clients_count: ENDPOINT_CACHE.clients[ENDPOINT_CACHE.ap.interface].active_wireless_clients,
    // ethernet_clients_count: ENDPOINT_CACHE.clients[ENDPOINT_CACHE.ap.interface].active_ethernet_clients,
    clients_count: ENDPOINT_CACHE.clients[ENDPOINT_CACHE.ap.interface].active_clients_amount,
    clients: ENDPOINT_CACHE.clients[ENDPOINT_CACHE.ap.interface].active_clients
  };
  
  res.json(payload);
});

app.get("/api/system", async (req, res) => {
  await refreshCache(['system', 'networking'], ENDPOINT_CACHE.ap.interface || 'wlan0');

  let payload = {
    hostname: ENDPOINT_CACHE.system.hostname,
    uptime: ENDPOINT_CACHE.system.uptime,
    systime: ENDPOINT_CACHE.system.systime,
    usedMemory: ENDPOINT_CACHE.system.usedMemory,
    usedDisk: ENDPOINT_CACHE.system.usedDisk,
    processorCount: ENDPOINT_CACHE.system.processorCount,
    LoadAvg1Min: ENDPOINT_CACHE.system.LoadAvg1Min,
    systemLoadPercentage: ENDPOINT_CACHE.system.systemLoadPercentage,
    systemTemperature: ENDPOINT_CACHE.system.systemTemperature,
    operatingSystem: ENDPOINT_CACHE.system.operatingSystem,
    kernelVersion: ENDPOINT_CACHE.system.kernelVersion,
    rpiRevision: ENDPOINT_CACHE.system.rpiRevision,
    raspapVersion: ENDPOINT_CACHE.system.raspapVersion,
    interfaces: ENDPOINT_CACHE.networking.interfaces,
	};
  
  res.json(payload);
});

app.get("/api/settings", async (req, res) => {
  // Get Screen Timeout
  let screenTimeout = 0;
  const data = await fs.readFile(
    path.join(__dirname, process.env.LABWC_AUTOSTART),
    'utf8'
  );

  if (data.includes('SCREEN_TIMEOUT=')) {
    let matches = data.match(/^SCREEN_TIMEOUT=(\d+)$/m);
    screenTimeout = Number.parseInt(matches[1]);
  }

  let payload = {
    screen_timeout: screenTimeout,
	};
  
  res.json(payload);
});

app.post('/api/screen-timeout/:seconds', async (req, res) => {
  try {
    const seconds = parseInt(req.params.seconds);

    if (isNaN(seconds) || seconds < 0) {
      return res.status(400).json({
        success: false,
        message: 'Seconds must be a valid non-negative number'
      });
    }

    const data = await fs.readFile(
      path.join(__dirname, process.env.LABWC_AUTOSTART),
      'utf8'
    );

    let newContent;
    if (data.includes('SCREEN_TIMEOUT=')) {
        newContent = data.replace(
            /^SCREEN_TIMEOUT=\d+$/m,
            `SCREEN_TIMEOUT=${seconds}`
        );
    }

    await fs.writeFile(
      path.join(__dirname, process.env.LABWC_AUTOSTART),
      newContent,
      'utf8'
    );

    // Restart Service
    try {
        const {stdout, stderr} = await exec('sudo systemctl restart raspap-labwc.service');

        if (stderr) {
          console.error(stderr);
        }
    } catch (e) {
        console.error('Failed to restart raspap-labwc.service:', e);
    }

    res.json({
        success: true,
        message: `Screen timeout set to ${seconds} seconds`,
        newValue: seconds
    });

  } catch (error) {
    console.error('Error updating screen timeout:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update screen timeout',
      error: error.message
    });
  }
});

app.get('/api/connect-qrcode', async (req, res) => {
  await refreshCache(['ap']);

  let connectionString = '';
  if (!ENDPOINT_CACHE.ap.wpa_passphrase) {
    connectionString= `WIFI:T:nopass;S:${ENDPOINT_CACHE.ap.ssid};;`
  } else {
    connectionString = `WIFI:T:WPA;S:${ENDPOINT_CACHE.ap.ssid};P:${ENDPOINT_CACHE.ap.wpa_passphrase};;`;
  }

  qrcode.toFile(
    path.join(__dirname, 'connect-qrcode.svg'),
    connectionString,
    {
      type: 'svg',
      margin: 1
    },
    (err) => {
      if (err) {
        console.error(err);
        res.statusCode(500).json(err);
        return;
      }

      res.sendFile(path.join(__dirname, 'connect-qrcode.svg'));
    }
  );
});

app.get('/api/hostname-qrcode', async (req, res) => {
  await refreshCache(['system']);

  qrcode.toFile(
    path.join(__dirname, 'hostname-qrcode.svg'),
    `http://${ENDPOINT_CACHE.system.hostname}.local`,
    {
      type: 'svg',
      margin: 1
    },
    (err) => {
      if (err) {
        console.error(err);
        res.statusCode(500).json(err);
        return;
      }

      res.sendFile(path.join(__dirname, 'hostname-qrcode.svg'));
    }
  );
});

app.get('/api/ap-ip-qrcode', async (req, res) => {
  await refreshCache(['networking', 'ap']);

  qrcode.toFile(
    path.join(__dirname, 'ap-ip-qrcode.svg'),
    `http://${ENDPOINT_CACHE.networking.interfaces[ENDPOINT_CACHE.ap.interface]?.IP_address}`,
    {
      type: 'svg',
      margin: 1
    },
    (err) => {
      if (err) {
        console.error(err);
        res.statusCode(500).json(err);
        return;
      }

      res.sendFile(path.join(__dirname, 'ap-ip-qrcode.svg'));
    }
  );
});

app.get('/api/update-available', async (req, res) => {
  const {stdout, stderr} = await exec('git fetch --quiet 2>/dev/null && [ $(git rev-list --count HEAD..@{u} 2>/dev/null || echo 0) -gt 0 ] && echo "true" || echo "false"');

  if (stderr) {
    console.error(stderr);
    res.statusCode(500).json(stderr);
    return;
  }

  res.json(cleanOutput(stdout));
});

app.get('/api/raspap-update', async (req, res) => {
  const {stdout, stderr} = await exec("curl -s https://api.github.com/repos/raspap/raspap-webgui/releases/latest | grep '\"tag_name\":' | sed -E 's/.*\"([^\"]+)\".*/\\1/'");

  if (stderr) {
    console.error(stderr);
    res.statusCode(500).json(stderr);
    return;
  }

  let hasUpdate = versionCompare(ENDPOINT_CACHE.system.raspapVersion, stdout);
  console.log(hasUpdate);

  res.json(`${hasUpdate}`);
});

app.post("/api/update", async (req, res) => {
  await exec('./update.sh')
});

app.post("/api/shutdown", async (req, res) => {
  await exec("sudo powerdown");
  res.json({ ok: true });
});

app.post("/api/reboot", async (req, res) => {
  await exec("sudo reboot");
  res.json({ ok: true });
});

app.use(express.static("html/dist"));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'html/dist/index.html'));
});


app.listen(8085, process.argv.includes('--host') ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`Backend running on port ${process.argv.includes('--host') ? '0.0.0.0' : '127.0.0.1'}:8085`);
});