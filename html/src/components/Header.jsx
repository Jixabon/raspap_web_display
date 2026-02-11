import { useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import RaspAPLogo from './RaspAPLogo';

import Modal from "./Modal";
import Overlay from './Overlay';


export default function Header({back = false, path = '/', title = '', ssid = null, passphrase = null}) {
	const { url } = useLocation();

	// Power Modals Flow
	const [open, setOpen] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [confirmedMethod, setConfirmedMethod] = useState(null);
	const [showPowerOverlay, setShowPowerOverlay] = useState(false);

	// QR Code Modal
	const [showQR, setShowQR] = useState(false);

	return (
		<>
			<header className="sticky top-0 flex justify-between items-center w-full px-6 py-4 bg-white/50 dark:bg-dark-blue/50 backdrop-blur-sm">
				{back ? (
					<>
						<a href={path}><i className="fa-solid fa-arrow-left text-3xl"></i></a>
						<span className="text-3xl">{title}</span>
					</>
				) : (
					<>
						<div onClick={() => setShowQR(true)}><i class="fa-solid fa-qrcode py-1 text-3xl"></i></div>
						<div className="flex gap-2 text-teal">
							<RaspAPLogo style={{width: 33, height: 33}}/>
							<span className="font-bold text-3xl">RaspAP</span>
						</div>
						<div onClick={() => setOpen(true)}><i class="fa-solid fa-power-off py-1 text-3xl"></i></div>
					</>
				)}
			</header>
			<Overlay show={showPowerOverlay}>
				<span className="font-bold text-4xl">
					{confirmedMethod == 'SHUTDOWN' ? 'Shutting Down...' : 'Rebooting...'}
				</span>
			</Overlay>
			<Modal
				isOpen={open}
				onClose={() => setOpen(false)}
				title="Power"
				showClose={false}
			>
				{!isConfirmed ? (
					<div class="flex flex-col gap-6">
						<button
							class="px-15 py-4 rounded bg-red-600 text-lg text-white hover:bg-red-700"
							onClick={() => {
								setIsConfirmed(true);
								setConfirmedMethod('SHUTDOWN');
							}}
						>
							Shutdown
						</button>
						<button
							class="px-15 py-4 rounded bg-yellow-600 text-lg text-white hover:bg-yellow-700"
							onClick={() => {
								setIsConfirmed(true);
								setConfirmedMethod('REBOOT');
							}}
						>
							Reboot
						</button>
						<button
							onClick={() => setOpen(false)}
							class="px-15 py-4 rounded text-lg text-teal border border-teal"
						>
							Cancel
						</button>
					</div>
				) : (
					<>
						<p className="text-lg font-bold mb-4">Are you sure you want to {confirmedMethod == 'SHUTDOWN' ? 'shutdown' : 'reboot'}?</p>
						<div class="flex flex-col gap-6">
							<button
								onClick={() => {
									setShowPowerOverlay(true);
									setOpen(false);

									fetch(confirmedMethod == 'SHUTDOWN' ? '/api/shutdown' : '/api/reboot', {
										method: 'POST'
									})
								}}
								class={`px-15 py-4 rounded text-lg text-white ${
									confirmedMethod == 'SHUTDOWN'
										? 'bg-red-600 hover:bg-red-700'
										: 'bg-yellow-600 hover:bg-yellow-700'
								}`}
							>
								{confirmedMethod == 'SHUTDOWN' ? 'Shutdown' : 'Reboot'}
							</button>
							<button
								onClick={() => {
									setIsConfirmed(false);
									setConfirmedMethod(null);
									setOpen(false);
								}}
								class="px-15 py-4 rounded text-lg text-teal border border-teal"
							>
								Cancel
							</button>
						</div>
					</>
				)}
			</Modal>
			<Modal
				isOpen={showQR}
				onClose={() => setShowQR(false)}
				title="Connect"
			>
				<div className="flex flex-col items-center gap-3">
					<img src="/api/connect-qrcode" style={{width: 250, height: 250}}></img>
					<span>
						SSID: {ssid}
					</span>
					<span>
						Password: {passphrase}
					</span>
				</div>
			</Modal>
		</>
	);
}
