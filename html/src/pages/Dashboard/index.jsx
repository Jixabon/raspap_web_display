import { useEffect, useState } from "preact/hooks";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Modal from "../../components/Modal";
import Overlay from '../../components/Overlay';


import Button from "../../components/Button";
import RaspAPLogo from "../../components/RaspAPLogo";
import { LONG_POLLING_INTERVAL } from "../../config";
import Toggle from "../../components/Toggle";

export function Dashboard() {
	const [data, setData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	const [hasUpdates, setHasUpdates] = useState(false);

	const [showAdminQR, setShowAdminQR] = useState(false);
	const [adminQRToggle, setAdminQRToggle] = useState(false);

	const default_data = {
		connection: {
			type: 'ethernet',
			ssid: null,
			interface: 'eth0',
			ipv4: '192.168.1.25',
		},
		revision: 'Pi 5 (8GB)',
		hostname: 'raspap',
		host: {
			ssid: 'RaspAP',
			passphrase: 'ChangeMe',
			interface: 'wlan0',
			ipv4: '10.3.141.1',
			clients_count: 0,
			hide_ssid: false,
		},

		statuses: {
			ap_enabled: true,
			ap_active: true,
			bridged_enabled: true,
			bridged_active: false,
			ad_block_enabled: true,
			ad_block_active: true,
			vpn_enabled: true,
			vpn_active: false,
			firewall_enabled: false,
			firewall_active: false,
		},

		raspapVersion: '3.5.2',
		uptime: 'up 11 hours, 38 minutes',
	};

	var pollingInterval = null;
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch('/api/dashboard');
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

	useEffect(() => {
		const fetchUpdates = async () => {

			let hasDisplayUpdate = false;
			try {
				const response = await fetch('/api/update-available');
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const jsonData = await response.json();
				hasDisplayUpdate = jsonData === 'true' ? true : false;
			} catch (e) {
				console.error(e);
			}

			let hasRaspAPUpdate = false;
			try {
				const response = await fetch('/api/raspap-update');
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const jsonData = await response.json();
				hasRaspAPUpdate = jsonData === 'true' ? true : false;
			} catch (e) {
				console.error(e);
			}

			setHasUpdates(hasDisplayUpdate || hasRaspAPUpdate);
		}

		fetchUpdates();
	}, []);

	console.log(data, isLoading, error);

	const connectionTypeIcons = {
		'ethernet': 'fa-ethernet',
	};

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
			<Header ssid={data.host.ssid} passphrase={data.host.passphrase} />
			<Modal
				isOpen={showAdminQR}
				onClose={() => setShowAdminQR(false)}
				title="Admin Panel"
			>
				<div className="flex flex-col items-center gap-3">
					<img src={adminQRToggle ? '/api/hostname-qrcode' : '/api/ap-ip-qrcode'} style={{width: 250, height: 250}}></img>
					<span>How would you like to connect?</span>
					<Toggle
						value={adminQRToggle}
						trueLabel="WAN"
						falseLabel="LAN"
						onChange={(x) => setAdminQRToggle(x)}
						/>
				</div>
			</Modal>
			<main className="flex flex-col h-full">
				<div className="flex-grow flex items-center">
					<div className="w-full grid grid-cols-3">
						<div className="self-start flex flex-col justify-center items-start">
							<div className="flex flex-col items-center mb-3">
								<span className="font-bold text-lg capitalize">{data.connection.type}</span>
								<span><i className={`fa-solid ${connectionTypeIcons[data.connection.type] || 'fa-circle-question'} text-4xl`}></i></span>
							</div>
							{data.connection.ssid && <span>{data.connection.ssid}</span>}
							<span>{data.connection.ipv4}</span>
						</div>
						<div className="flex flex-col justify-center items-center">
							<span><i className="fa-solid fa-server text-4xl mb-4"></i></span>
							<span>{data.revision}</span>
							<span>{data.hostname}</span>
							<button className="text-teal text-underline"
								onClick={() => setShowAdminQR(true)}
							>
								Admin Panel
							</button>
						</div>
						<div className="self-start flex flex-col justify-center items-end">
							<div className="flex flex-col items-center mb-3">
								<span className="font-bold text-lg">AP</span>
								<span><i className="fa-solid fa-bullseye text-4xl"></i></span>
							</div>
							<span>{data.host.hide_ssid && 'Hidden: '}{data.host.ssid}</span>
							<span>{data.host.ipv4}</span>
							<span>Clients: {data.host.clients_count}</span>
						</div>
					</div>
				</div>
				<div className="flex justify-center gap-6 mb-8">
					<StatusIcon
						icon="fa-bullseye"
						text="AP"
						enabled={data.statuses.ap_enabled}
						active={data.statuses.ap_active} />
					<StatusIcon
						icon="fa-bridge"
						text="Bridged"
						enabled={data.statuses.bridged_enabled}
						active={data.statuses.bridged_active} />
					<StatusIcon
						icon="fa-hand"
						text="Ad Block"
						enabled={data.statuses.ad_block_enabled}
						active={data.statuses.ad_block_active} />
					<StatusIcon
						icon="fa-shield-halved"
						text="VPN"
						enabled={data.statuses.vpn_enabled}
						active={data.statuses.vpn_active} />
					<StatusIcon
						icon="fa-fire-flame-curved"
						text="Firewall"
						enabled={data.statuses.firewall_enabled}
						active={data.statuses.firewall_active} />
				</div>
				<div className="grid grid-cols-2 gap-4">
					<a href="/connection"><DashboardButton icon="fa-globe" text="Connection" /></a>
					<a href="/access-point"><DashboardButton icon="fa-bullseye" text="AP" /></a>
					<a href="/vpn"><DashboardButton icon="fa-shield-halved" text="VPN (WIP)" /></a>
					<a href="/firewall"><DashboardButton icon="fa-fire-flame-curved" text="Firewall (WIP)" /></a>
					<a href="/settings"><DashboardButton icon="fa-cog" text="Settings" /></a>
					<a href="/system"><DashboardButton icon="fa-circle-info" text="System" showNotif={hasUpdates} /></a>
				</div>
			</main>
			<Footer version={data.version} uptime={data.uptime} />
		</>
	);
}

function DashboardButton({icon, text, showNotif = false}) {
	return (
		<Button className="w-full py-6 flex flex-col items-center gap-2 text-white">
			<div className="relative">
				<i className={`fa-solid ${icon} text-3xl`}></i>
				{showNotif && (
					<span class="absolute top-0 right-0 flex size-3">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-80"></span>
						<span class="relative inline-flex size-3 rounded-full bg-red-700"></span>
					</span>
				)}
			</div>
			<span className="font-bold">{text}</span>
		</Button>
	)
}

function StatusIcon({icon, text, enabled = true, active}) {
	return (
		<div className={`relative flex flex-col items-center gap-2 ${active ? 'text-teal' : 'text-gray-400'}`}>
			{!enabled && (<span className={`absolute -top-3 bg-gray-400 rounded -rotate-45`} style={{width: 5, height: 60}}></span>)}
			<i className={`fa-solid ${icon} text-4xl`}></i>
			<span>{text}</span>
		</div>
	)
}