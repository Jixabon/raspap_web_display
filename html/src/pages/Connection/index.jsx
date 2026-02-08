import { useEffect, useState } from "preact/hooks";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Overlay from '../../components/Overlay';
import RaspAPLogo from "../../components/RaspAPLogo";
import { LONG_POLLING_INTERVAL } from "../../config";
import Modal from "../../components/Modal";
import Button from "../../components/Button";

export function Connection() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const default_data = {
        interface: 'wlan0',
        ssid: 'RaspAP',
        hide_ssid: false,
        wpa_key_mgmt: 'WPA-PSK',
        wpa: '2',
        passphrase: 'ChangeMe',
        channel: '1',
        hw_mode: 'g',
        frequency_band: '2.4',
        ipv4: '10.3.141.1',
        dhcp: {
            range_start: "10.3.141.50",
            range_end: "10.3.141.254",
            range_subnet_mask: "255.255.255.0",
            range_lease_time: "12h",
            range_gateway: "10.3.141.1",
            range_nameservers: [
                "9.9.9.9",
                "1.1.1.1"
            ]
        },
        clients_count: 1,
        wireless_clients_count: 2,
        ethernet_clients_count: 1,
        clients: []
    };

    var pollingInterval = null;
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/connection');
                if (!response.ok) {
                throw new Error('Network response was not ok');
                }
                const jsonData = await response.json();
                setData(jsonData);
            } catch (e) {
                setError(e);
                setData(default_data);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        pollingInterval = setInterval(() => {
            fetchData();
        }, LONG_POLLING_INTERVAL);

        return () => {
            clearInterval(pollingInterval);
        }
    }, [pollingInterval]);

    console.log(data, isLoading, error);

    if (isLoading) {
        return <Overlay show={true}>
            <div className="flex flex-col items-center gap-6">
                <RaspAPLogo style={{width: 150, height: 150}} animate={true}/>
                <span className="text-3xl font-bold">Loading...</span>
            </div>
        </Overlay>
    }

    return (
        <>
            <Header back={true} title="Connection" />
            <main>
                <div className="flex flex-col items-center mb-6">
                    <div className="mb-2">
                        <i className="fa-solid fa-globe text-9xl"></i>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}