import { useEffect, useState } from "preact/hooks";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Overlay from '../../components/Overlay';
import RaspAPLogo from "../../components/RaspAPLogo";

export function System() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showAdminQR, setShowAdminQR] = useState(false);

    const default_data = {
        hostname: "raspap",
        uptime: "up 2 days, 4 hours, 31 minutes",
        systime: "Fri  6 Feb 23:32:26 MST 2026",
        usedMemory: 19.88,
        processorCount: 4,
        LoadAvg1Min: 0,
        systemLoadPercentage: 0,
        systemTemperature: 56.2,
        operatingSystem: "Debian GNU/Linux 13 (trixie)",
        kernelVersion: "6.12.62+rpt-rpi-2712",
        rpiRevision: "Pi 5 (8 GB)",
        raspapVersion: '3.5.2',
        networking: {
            interfaces: {
                eth0: {
                    IP_address: "192.168.1.25",
                    Netmask: "255.255.255.0",
                    MAC_address: "2c:cf:67:52:8e:b0"
                },
                wlan0: {
                    IP_address: "10.3.141.1",
                    Netmask: "255.255.255.0",
                    MAC_address: "2c:cf:67:52:8e:b3"
                }
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/system');
                console.log(response);
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
    }, []);

    console.log(data, isLoading, error);

    if (isLoading) {
        return <Overlay show={true}>
            <span>Loading...</span>
        </Overlay>
    }

    return (
        <>
            <Header back={true} title="System Info" />
            <main>
                <div className="flex flex-col items-center mb-8">
                    <RaspAPLogo style={{width: 150, height: 150}} className="mb-3 text-teal" />
                    <span className="text-4xl font-bold text-teal">RaspAP</span>
                    <span>v{data.raspapVersion}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 mb-8">
                    <span className="font-bold">Hardware</span>
                    <span>{data.rpiRevision}</span>
                    <span className="font-bold">Hostname</span>
                    <span>{data.hostname}</span>
                    <span className="font-bold">Operating System</span>
                    <span>{data.operatingSystem}</span>
                    <span className="font-bold">Kernel Version</span>
                    <span>{data.kernelVersion}</span>
                    <span className="font-bold">System Time</span>
                    <span>{data.systime}</span>
                    <span className="font-bold">Uptime</span>
                    <span>{data.uptime}</span>
                </div>
                <div className="mb-8">
                    <div className="relative flex justify-center bg-white rounded-lg h-6">
                        <div className="absolute top-0 left-0 bg-blue-200 rounded-lg h-6" style={{width: '50%'}}></div>
                        <span className="text-black z-10">50%</span>
                    </div>
                </div>
                <div>
                    <details className="border rounded">
                        <summary className="rounded px-4 py-2 text-3xl">Interfaces</summary>
                        {Object.entries(data?.networking?.interfaces).map(([key, item]) => {
                            return (
                                <div className="mt-5 px-4 last:mb-5">
                                    <h3 className="w-full text-2xl font-bold mb-3 border-b">{key}</h3>
                                    <div className="grid grid-cols-2 gap-y-2">
                                        <span className="font-bold">IP Address</span>
                                        <span>{item.IP_address}</span>
                                        <span className="font-bold">Netmask</span>
                                        <span>{item.Netmask}</span>
                                        <span className="font-bold">MAC Address</span>
                                        <span>{item.MAC_address}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </details>
                </div>
            </main>
            <Footer />
        </>
    );
}