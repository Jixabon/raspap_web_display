import { useEffect, useState } from "preact/hooks";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Overlay from '../../components/Overlay';
import RaspAPLogo from "../../components/RaspAPLogo";
import { LONG_POLLING_INTERVAL } from "../../config";
import Modal from "../../components/Modal";
import Button from "../../components/Button";

export function AP() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showDHCP, setShowDHCP] = useState(false);
    const [showInterface, setShowInterface] = useState(false);

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
                const response = await fetch('/api/ap');
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

    let wirelessClients = (data?.clients || []).filter((c) => c.connection_type === 'wireless');
    let ethernetClients = (data?.clients || []).filter((c) => c.connection_type === 'ethernet');
    let unknownClients = (data?.clients || []).filter((c) => c.connection_type === 'unknown');

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
            <Header back={true} title="Access Point" />
            <main>
                <div className="flex flex-col items-center mb-6">
                    <div className="mb-2">
                        <i className="fa-solid fa-bullseye text-9xl"></i>
                    </div>
                    <div>
                        <span className="font-bold whitespace-nowrap pr-2">Clients</span>
                        <span>{data.clients_count}</span>
                    </div>
                    <div className="flex gap-4">
                        <div>
                            <span className="font-bold whitespace-nowrap pr-2">SSID</span>
                            <span>{data.hide_ssid && 'Hidden: '}{data.ssid}</span>
                        </div>
                        <div>
                            <span className="font-bold whitespace-nowrap pr-2">Password</span>
                            <span>{data.passphrase}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-center gap-3 mb-8">
                    <Button className="text-white" onClick={() => setShowInterface(true)}>Interface</Button>
                    <Modal
                        isOpen={showInterface}
                        onClose={() => setShowInterface(false)}
                        title="Interface"
                    >
                        <div className="grid grid-cols-[min-content_1fr] gap-y-2 mb-8">
                            <span className="font-bold whitespace-nowrap pr-6">Interface</span>
                            <span>{data.interface}</span>
                            <span className="font-bold whitespace-nowrap pr-6">IP</span>
                            <span>{data.ipv4}</span>
                            <span className="font-bold whitespace-nowrap pr-6">Wireless Mode</span>
                            <span>802.11{data.hw_mode} {data.frequency_band}GHz</span>
                            <span className="font-bold whitespace-nowrap pr-6">Encryption</span>
                            <span>{data.wpa_key_mgmt} {data.wpa}</span>
                            <span className="font-bold whitespace-nowrap pr-6">Channel</span>
                            <span>{data.channel}</span>
                        </div>
                    </Modal>
                    <Button className="text-white" onClick={() => setShowDHCP(true)}>DHCP</Button>
                    <Modal
                        isOpen={showDHCP}
                        onClose={() => setShowDHCP(false)}
                        title="DHCP"
                    >
                        <div className="grid grid-cols-[min-content_1fr] gap-y-2 mb-8">
                            <span className="font-bold whitespace-nowrap pr-6">Range</span>
                            <span>{data.dhcp.range_start} - {data.dhcp.range_end}</span>
                            <span className="font-bold whitespace-nowrap pr-6">Subnet Mask</span>
                            <span>{data.dhcp.range_subnet_mask}</span>
                            <span className="font-bold whitespace-nowrap pr-6">Lease Time</span>
                            <span>{data.dhcp.range_lease_time}</span>
                            <span className="font-bold whitespace-nowrap pr-6">Gateway</span>
                            <span>{data.dhcp.range_gateway}</span>
                            <span className="font-bold whitespace-nowrap pr-6">Nameservers</span>
                            <div className="flex flex-col">
                                {data.dhcp.range_nameservers.map((nameserver) => (
                                    <span>{nameserver}</span>
                                ))}
                            </div>
                        </div>
                    </Modal>
                </div>

                <h3 className="font-bold text-2xl mb-2">Wireless ({data.wireless_clients_count || 0})</h3>
                <div className="border rounded-2xl mb-3">
                    {!wirelessClients || wirelessClients.length === 0 ? (
                        <span className="inline-block w-full text-center p-3">There are currently no wireless clients</span>
                    ) : (
                        <>
                            {wirelessClients.map((client) => (
                                <ClientLine client={client}/>
                            ))}
                        </>
                    )}
                </div>
                <h3 className="font-bold text-2xl mb-2">Ethernet ({data.ethernet_clients_count || 0})</h3>
                <div className="border rounded-2xl mb-3">
                    {!ethernetClients || ethernetClients.length === 0 ? (
                        <span className="inline-block w-full text-center p-3">There are currently no ethernet clients</span>
                    ) : (
                        <>
                            {ethernetClients.map((client) => (
                                <ClientLine client={client}/>
                            ))}
                        </>
                    )}
                </div>
                {unknownClients.length > 0 && (
                    <>
                        <h3 className="font-bold text-2xl mb-2">Unknown</h3>
                        <div className="border rounded-2xl mb-3">
                            {unknownClients.map((client) => (
                                <ClientLine client={client}/>
                            ))}
                        </div>
                    </>  
                )}
            </main>
            <Footer />
        </>
    );
}

function ClientLine({client}) {
    return (
        <div className="flex items-center p-3 gap-3 border-b last:border-none">
            <div className="self-stretch flex items-center border-r pr-3">
                <i className={`${getDeviceIcon(client.hostname)} text-4xl`}></i>
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-xl">{client.hostname}</span>
                <div className="flex gap-3">
                    <span className="whitespace-nowrap">IP: {client.ip_address}</span>
                    <span className="whitespace-nowrap">MAC: {client.mac_address}</span>
                </div>
                <span>Lease: {new Date(client.timestamp * 1000).toISOString()}</span>
            </div>
        </div>
    )
}

function getDeviceIcon(name) {
  if (!name) return "fa-solid fa-question";

  const n = name.toLowerCase();

  const rules = [
    { 
        regex: /(router|gateway|modem|switch|ap|accesspoint|unifi|ubiquiti|tplink|netgear|asus|linksys)/,
        icon: "fa-solid fa-network-wired"
    },
    {
        regex: /(server|nas|proxmox|docker|vm|esxi|truenas|synology|qnap|backup)/,
        icon: "fa-solid fa-server"
    },
    {
        regex: /(pc|desktop|laptop|macbook|imac|windows|linux|workstation|thinkpad|dell|hp|surface|chromebook)/,
        icon: "fa-solid fa-computer"
    },
    {
        regex: /(iphone|android|pixel|galaxy|phone|mobile|oneplus|moto|xiaomi|huawei)/,
        icon: "fa-solid fa-mobile-screen"
    },
    {
        regex: /(ipad|tablet|galaxy-tab|kindle|fire)/,
        icon: "fa-solid fa-tablet-screen-button"
    },
    {
        regex: /(printer|scanner|laserjet|officejet|epson|brother|canon)/,
        icon: "fa-solid fa-print"
    },
    {
        regex: /(tv|roku|firetv|chromecast|appletv|shield|plex|kodi|smarttv|vizio|samsungtv|lg-tv)/,
        icon: "fa-solid fa-tv"
    },
    {
        regex: /(xbox|playstation|ps4|ps5|switch|nintendo|steamdeck)/,
        icon: "fa-solid fa-gamepad"
    },
    {
        regex: /(camera|cam|ipcam|doorbell|ring|arlo|wyze|reolink|hikvision|nestcam|cctv|security)/,
        icon: "fa-solid fa-camera"
    },
    {
        regex: /(iot|smart|plug|bulb|light|hue|kasa|shelly|sonoff|switch|thermostat|nest|ecobee|alexa|echo|googlehome|homepod)/,
        icon: "fa-solid fa-house"
    },
    {
        regex: /(watch|applewatch|galaxywatch|fitbit|garmin|band)/,
        icon: "fa-solid fa-clock"
    },
    {
        regex: /(tesla|car|auto|ev|ford|toyota|hyundai|bmw)/,
        icon: "fa-solid fa-car"
    },
  ];

  for (const rule of rules) {
    if (rule.regex.test(n)) {
      return rule.icon;
    }
  }

  return "fa-solid fa-question";
}
