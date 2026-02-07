import util from 'node:util';
import child_process from 'child_process';
const exec = util.promisify(child_process.exec);

export async function getRaspAPVersion() {
    exec("grep 'RASPI_VERSION' /var/www/html/includes/defaults.php | awk -F\"'\" '{print $4}'")
        .then((stdout) => {
            return stdout;
        })
        .catch((e) => {
            console.error(e);
        });
}

export async function getAPInterface() {
    exec("cat /etc/hostapd/hostapd.conf | grep '^interface=' | cut -d'=' -f2")
        .then((stdout) => {
            return stdout;
        })
        .catch((e) => {
            console.error(e);
        });
}

export async function getWPAPassphrase() {
    exec("sed -En 's/wpa_passphrase=(.*)/\\1/p' /etc/hostapd/hostapd.conf")
        .then((stdout) => {
            return stdout;
        })
        .catch((e) => {
            console.error(e);
            return null;
        });
}