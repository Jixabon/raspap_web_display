import { useEffect, useState } from "preact/hooks";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Overlay from '../../components/Overlay';
import RaspAPLogo from '../../components/RaspAPLogo';
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import TimePickerModal from "../../components/TimePicker";
import { setThemeBySchedule } from "../..";

export function Settings() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    function minutesToHours(minutes) {
        if (!minutes) {
            return null;
        }

        let hrs = ("00" + (minutes / 60)).slice (-2);
        let min = ("00" + (minutes % 60)).slice (-2);

        return `${hrs}:${min}`;
    }

    function timeToMinutes(time) {
        let hm = time.split(':');
        if (!hm) return null;
        return Number.parseInt(hm[0]) * 60 + Number.parseInt(hm[1]);
    }

    function format24to12(time) {
        let hrs = Number.parseInt(time.substr(0, 2));
        let isAM = hrs <= 12;
        return `${isAM ? time : time.replace(hrs, hrs - 12)} ${isAM ? 'AM' : 'PM'}`;
    }
    
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'schedule');
    const [lightTime, setLightTime] = useState(minutesToHours(localStorage.getItem('lightMinutes')) || '06:00');
    const [showLightPicker, setShowLightPicker] = useState(false);
    const [darkTime, setDarkTime] = useState(minutesToHours(localStorage.getItem('darkMinutes')) || '18:00');
    const [showDarkPicker, setShowDarkPicker] = useState(false);

    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const [screenTimeout, setScreenTimeout] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/settings');
                if (!response.ok) {
                throw new Error('Network response was not ok');
                }
                const jsonData = await response.json();
                setData(jsonData);

                if (jsonData?.screen_timeout && jsonData.screen_timeout !== screenTimeout) {
                    setScreenTimeout(jsonData.screen_timeout);
                }
            } catch (e) {
                setError(e);
                // setData(default_data);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    console.log(data, isLoading, error);

    if (isLoading) {
        return <Overlay show={true}>
            <div className="flex flex-col items-center gap-6">
                <RaspAPLogo style={{width: 150, height: 150}} animate={true}/>
                <span className="text-3xl font-bold">Loading...</span>
            </div>
        </Overlay>
    }

    function setTheme(mode) {
        setCurrentTheme(mode);
        switch (mode) {
            case 'schedule':
                localStorage.removeItem('theme');
                setThemeBySchedule();
                break;
            case 'light':
                localStorage.theme = 'light';
                document.documentElement.classList.remove('dark');
                break;
            case 'dark':
                localStorage.theme = 'dark';
                document.documentElement.classList.add('dark');
                break;
            default:
                break;
        }
    }

    async function postScreenTimeout() {
        await fetch(
            `/api/screen-timeout/${screenTimeout}`,
            {
                method: 'POST'
            }
        );
    }

    return (
        <>
            <Header back={true} title="Settings" />
            <main>
                <h2 className="font-bold text-2xl mb-2">Theme</h2>
                <div className="grid grid-cols-3 border border-dark-blue dark:border-white rounded-lg mb-8">
                    <button
                        className={`border-r border-dark-blue dark:border-white rounded-l-lg ${
                            currentTheme === 'schedule' ? 'bg-dark-blue dark:bg-white text-white dark:text-dark-blue' : ''
                        }`}
                        onClick={() => setTheme('schedule')}
                    >
                        <div className="py-3 flex flex-col items-center gap-2">
                            <i className="fa-solid fa-clock text-3xl"></i>
			                <span className="font-bold">Schedule</span>
                        </div>
                    </button>
                    <button
                        className={`border-r border-dark-blue dark:border-white ${
                            currentTheme === 'light' ? 'bg-dark-blue dark:bg-white text-white dark:text-dark-blue' : ''
                        }`}
                        onClick={() => setTheme('light')}
                    >
                        <div className="py-3 flex flex-col items-center gap-2">
                            <i className="fa-solid fa-sun text-3xl"></i>
			                <span className="font-bold">Light</span>
                        </div>
                    </button>
                    <button
                        className={`rounded-r-lg ${
                            currentTheme === 'dark' ? 'bg-dark-blue dark:bg-white text-white dark:text-dark-blue' : ''
                        }`}
                        onClick={() => setTheme('dark')}
                    >
                        <div className="py-3 flex flex-col items-center gap-2">
                            <i className="fa-solid fa-moon text-3xl"></i>
			                <span className="font-bold">Dark</span>
                        </div>
                    </button>
                </div>

                <h2 className="font-bold text-2xl mb-2">Theme Schedule</h2>
                <div className="flex gap-3 mb-8">
                    <div className="flex flex-col">
                        <span className="font-bold text-lg mb-1">Set Light @</span>
                        <input
                            type="text"
                            readOnly
                            value={format24to12(lightTime)}
                            onClick={() => setShowLightPicker(true)}
                            className="p-2 text-lg border border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <TimePickerModal
                            isOpen={showLightPicker}
                            onClose={() => setShowLightPicker(false)}
                            onChange={(time) => {
                                setLightTime(time);
                                localStorage.lightMinutes = timeToMinutes(time);
                            }}
                            initialTime={lightTime}
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg mb-1">Set Dark @</span>
                        <input
                            type="text"
                            readOnly
                            value={format24to12(darkTime)}
                            onClick={() => setShowDarkPicker(true)}
                            className="p-2 text-lg border border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <TimePickerModal
                            isOpen={showDarkPicker}
                            onClose={() => setShowDarkPicker(false)}
                            onChange={(time) => {
                                setDarkTime(time);
                                localStorage.darkMinutes = timeToMinutes(time);
                            }}
                            initialTime={darkTime}
                        />
                    </div>
                </div>

                <h2 className="font-bold text-2xl mb-2">Screen Timeout</h2>
                <div className="flex items-center gap-3 mb-8">
                    <input type="number" className="border rounded-lg px-4 py-2"
                        min="0" max="1000" value={screenTimeout} onChange={(e) => setScreenTimeout(e.target.value)}></input>
                    <span>Seconds</span>
                    <Button className="px-4 py-2 text-white" onClick={() => setShowTimeoutModal(true)}>Set</Button>
                </div>
                <Modal
                    isOpen={showTimeoutModal}
                    onClose={() => setShowTimeoutModal(false)}
                    title="Service Restart"
                >
                    <div className="flex flex-col gap-3">
                        <p>To set the screen timeout, the service must restart. Restart the service now?</p>
                        <Button className="text-white" onClick={() => postScreenTimeout()}>Restart Service</Button>
                        <Button className="bg-transparent text-teal border border-teal" onClick={() => setShowTimeoutModal(false)}>Not Now</Button>
                    </div>
                </Modal>

                {/* <h2 className="font-bold text-2xl mb-2">Brightness</h2>
                <div className="flex gap-3 mb-8">
                    <input type="range" className="w-full"
                        min="0" max="100" value="50" disabled></input>
                </div>

                <h2 className="font-bold text-2xl mb-2">Brightness Schedule</h2>
                <div className="flex flex-col gap-3 mb-8">
                    <div className="flex gap-2">
                        <input type="checkbox" disabled></input>
                        <span className="font-bold text-lg">Use Schedule</span>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex flex-col">
                            <span className="font-bold text-lg">Set Bright @</span>
                            <input type="time" className="border rounded-lg p-2" disabled></input>
                            <input type="number" className="border rounded-lg p-2"
                                min="0" max="100" step="1" disabled></input>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg">Set Dim @</span>
                            <input type="time" className="border rounded-lg p-2" disabled></input>
                            <input type="number" className="border rounded-lg p-2"
                                min="0" max="100" step="1" disabled></input>
                        </div>
                    </div>
                </div> */}
            </main>
            <Footer />
        </>
    );
}