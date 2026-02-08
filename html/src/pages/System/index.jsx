import { useEffect, useState } from "preact/hooks";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Overlay from '../../components/Overlay';
import RaspAPLogo from "../../components/RaspAPLogo";
import { SHORT_POLLING_INTERVAL } from "../../config";
import Metric from "../../components/Metric";

export function System() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const default_data = {
        hostname: "raspap",
        uptime: "up 2 days, 4 hours, 31 minutes",
        systime: "Fri  6 Feb 23:32:26 MST 2026",
        usedMemory: 19.88,
        useDisk: 0,
        processorCount: 4,
        LoadAvg1Min: 0,
        systemLoadPercentage: 0,
        systemTemperature: 56.2,
        operatingSystem: "Debian GNU/Linux 13 (trixie)",
        kernelVersion: "6.12.62+rpt-rpi-2712",
        rpiRevision: "Pi 5 (8 GB)",
        raspapVersion: '3.5.2',
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
    };

    var pollingInterval = null;
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/system');
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
		}, SHORT_POLLING_INTERVAL);

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
            <Header back={true} title="System Info" />
            <main>
                <div className="flex flex-col items-center mb-8">
                    <RaspAPLogo style={{width: 150, height: 150}} className="mb-3 text-teal" />
                    <span className="text-4xl font-bold text-teal">RaspAP</span>
                    <span>v{data.raspapVersion}</span>
                </div>
                <div className="grid grid-cols-[min-content_1fr] gap-y-2 mb-8">
                    <span className="font-bold whitespace-nowrap pr-6">Hardware</span>
                    <span>{data.rpiRevision}</span>
                    <span className="font-bold whitespace-nowrap pr-6">Hostname</span>
                    <span>{data.hostname}</span>
                    <span className="font-bold whitespace-nowrap pr-6">Operating System</span>
                    <span>{data.operatingSystem}</span>
                    <span className="font-bold whitespace-nowrap pr-6">Kernel Version</span>
                    <span>{data.kernelVersion}</span>
                    <span className="font-bold whitespace-nowrap pr-6">System Time</span>
                    <span>{data.systime}</span>
                    <span className="font-bold whitespace-nowrap pr-6">Uptime</span>
                    <span>{data.uptime}</span>
                </div>
                <div className="mb-8">
                    {/*
                    processorCount: 4,
                    systemTemperature: 56.2, */}
                    <span className="font-bold">Memory Used</span>
                    <Metric value={data.usedMemory} suffix="%" className="mb-3"/>
                    <span className="font-bold">Disk Used</span>
                    <Metric value={data.usedDisk} suffix="%" className="mb-3"/>
                    <div className="flex gap-2"><span className="font-bold">CPU Load</span><span>({data.LoadAvg1Min}% 1min avg)</span></div>
                    <Metric value={data.systemLoadPercentage} suffix="%" className="mb-3"/>
                    <span className="font-bold">CPU Temp</span>
                    <Metric value={data.systemTemperature} suffix="C" className="mb-3"/>
                </div>
                <div>
                    <details className="border rounded">
                        <summary className="flex justify-between items-center rounded px-4 py-2 text-2xl">
                            <span>Interfaces ({Object.keys(data?.interfaces).length})</span>
                            <span><i className="fa-solid fa-plus"></i></span>
                        </summary>
                        {Object.entries(data?.interfaces).map(([key, item]) => {
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