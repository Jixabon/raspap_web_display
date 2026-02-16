import { useEffect, useState } from "preact/hooks";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Overlay from '../../components/Overlay';
import RaspAPLogo from "../../components/RaspAPLogo";
import { connectionTypeIcons } from "../Dashboard";
import { LONG_POLLING_INTERVAL } from "../../config";

export function Connection() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const default_data = {
        connection_type: 'wireless',
        interface: 'wlan0',
        ipv4: '192.168.1.25',
        connected: {
            ssid: 'HotelInternet',
            channel: 4,
            RSSI: '-33',
            security: 'WPA'
        },
        known: [],
        nearby: [
            {
                ssid: "McDonalds",
                channel: 4,
                RSSI: '-70',
                security: 'WPA/WPA2'
            }
        ],
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
                    <div className="relative mb-2">
                        <i className="fa-solid fa-globe text-9xl"></i>
                        <span className="absolute top-1/2 left-1/2 transform -translate-1/2 flex justify-center items-center bg-white rounded-full size-17">
                            <i className={`fa-solid ${connectionTypeIcons[data.connection_type] || 'fa-circle-question'} text-4xl`}></i>
                        </span>
                    </div>
                    <h2 className="font-bold text-2xl capitalize">{data.connection_type}</h2>

                </div>

                <div className="grid grid-cols-[min-content_1fr] gap-y-2 mb-8">
                    <span className="font-bold whitespace-nowrap pr-6">Interface</span>
                    <span>{data.interface}</span>
                    <span className="font-bold whitespace-nowrap pr-6">WAN IP</span>
                    <span>{data.ipv4}</span>
                    {data.connection_type === 'wireless' && (
                        <>
                            <span className="font-bold whitespace-nowrap pr-6">SSID</span>
                            <span>{data.connected.ssid}</span>
                        </>
                    )}
                </div>

                {data.connection_type === 'wireless' && (
                    <>
                        <h2 className="font-bold text-2xl mb-2">Known</h2>

                        <div>
                            {data.known.map((network) => <WiFiCard network={network} />)}
                        </div>

                        <h2 className="font-bold text-2xl mb-2">Nearby</h2>

                        <div>
                            {data.nearby.map((network) => <WiFiCard network={network} />)}
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </>
    );
}

function WiFiCard({network}) {
    return (
        <div>{network.ssid}</div>
    )
}
