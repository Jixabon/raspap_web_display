import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'node:util';
import child_process from 'child_process';
import qrcode from 'qrcode';

import * as fallbacks from './fallbacks.js';

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
          "access_token": `${process.env.RASPAP_API_KEY}`
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
    ENDPOINT_CACHE.ap = await res_ap.json();
  }
  if (endpoints.includes('clients')) {
    const res_clients = await fetch_api(`/clients/${clientsInterface}`);
    ENDPOINT_CACHE.clients = await res_clients.json();
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
    }

    if (endpoints.includes('ap')) {
      ENDPOINT_CACHE.ap.interface = await fallbacks.getAPInterface();
      ENDPOINT_CACHE.ap.wpa_passphrase = await fallbacks.getWPAPassphrase();
    }
  }
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
  await refreshCache(['system', 'ap', 'clients'], ENDPOINT_CACHE.ap.interface || 'wlan0');

  let connectionInterface = await getConnectionInterface();
  let connectionType = getConnectionType(connectionInterface);

  let dashboardData = {
		connection: {
			type: connectionType,
			ssid: connectionType == 'wireless' ? 'ssid' : null,
			interface: connectionInterface,
			ipv4: '192.168.1.25',
		},
		revision: ENDPOINT_CACHE.system.rpiRevision,
		hostname: ENDPOINT_CACHE.system.hostname,
		host: {
			ssid: ENDPOINT_CACHE.ap.ssid,
      passphrase: ENDPOINT_CACHE.ap.wpa_passphrase,
			interface: ENDPOINT_CACHE.ap.interface,
			ipv4: '10.3.141.1',
			clients_count: ENDPOINT_CACHE.clients.active_client_amount,
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

    version: ENDPOINT_CACHE.system.raspap_version,
		uptime: ENDPOINT_CACHE.system.uptime,
	};
  
  res.json(dashboardData);
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

app.post("/api/shutdown", (req, res) => {
  exec("sudo powerdown");
  res.json({ ok: true });
});

app.post("/api/reboot", (req, res) => {
  exec("sudo reboot");
  res.json({ ok: true });
});

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'html/dist', req.path));
});

// app.use(express.static("html/dist"));

app.listen(8085, process.argv.includes('--host') ? '0.0.0.0' : '127.0.0.1', () => {
  console.log("Backend running on port 8085");
});