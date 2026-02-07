import util from 'node:util';
import child_process from 'child_process';
const exec = util.promisify(child_process.exec);

export function cleanOutput(string) {
    string = string.replace(/[\n\r]/g, '');
    string = string.trim();

    return string;
}

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
    const {stdout, stderr} = await exec("df -h / | awk 'NR==2 {print $5}'");
    
    if (stderr) {
        console.error(stderr);
        return;
    }

    return Number.parseInt(stdout.trim().replace('%', ''));
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

export async function getWPAPassphrase() {
    const {stdout, stderr} = await exec("sed -En 's/wpa_passphrase=(.*)/\\1/p' /etc/hostapd/hostapd.conf");
    
    if (stderr) {
        console.error(stderr);
        return;
    }

    return cleanOutput(stdout);
}

export async function getWirelessClients(intrfc) {
    const {stdout, stderr} = await exec(`iw dev ${intrfc} station dump`);
    
    if (stderr) {
        console.error(stderr);
        return;
    }

    const lines = stdout.split(/\r?\n/);

    // enumerate 'station' entries (each represents a wireless client)
    let clientCount = lines.reduce((clientCount, line) => {
        if (line.indexOf('Station', 0) > -1) {
            return clientCount + 1;
        }
        return clientCount;
    }, 0);
    return clientCount;
}