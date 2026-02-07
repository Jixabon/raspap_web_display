import util from 'node:util';
import child_process from 'child_process';
const exec = util.promisify(child_process.exec);

export function cleanOutput(string) {
    string = string.replace(/[\n\r]/g, '');
    string = string.trim();

    return string;
}

export async function getRaspAPVersion() {
    const {stdout, stderr} = await exec("grep 'RASPI_VERSION' /var/www/html/includes/defaults.php | awk -F\"'\" '{print $4}'");
    
    if (stderr) {
        console.error(stderr);
        return;
    }

    return cleanOutput(stdout);
}

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