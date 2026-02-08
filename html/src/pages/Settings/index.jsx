import { useEffect, useState } from "preact/hooks";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Overlay from '../../components/Overlay';
import RaspAPLogo from '../../components/RaspAPLogo';

export function Settings() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/settings');
                if (!response.ok) {
                throw new Error('Network response was not ok');
                }
                const jsonData = await response.json();
                setData(jsonData);
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
        switch (mode) {
            case 'schedule':
                localStorage.removeItem('theme');
                // setThemeBySchedule();
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

    return (
        <>
            <Header back={true} title="Settings" />
            <main>
                <h2 className="font-bold text-2xl mb-2">Theme</h2>
                <div className="grid grid-cols-3 border border-dark-blue dark:border-white rounded-lg mb-8">
                    <button
                        className="border-r border-dark-blue dark:border-white"
                        onClick={() => setTheme('schedule')}
                    >
                        <div className="py-3 flex flex-col items-center gap-2">
                            <i className="fa-solid fa-clock text-3xl"></i>
			                <span className="font-bold">Schedule</span>
                        </div>
                    </button>
                    <button
                        className="border-r border-dark-blue dark:border-white"
                        onClick={() => setTheme('light')}
                    >
                        <div className="py-3 flex flex-col items-center gap-2">
                            <i className="fa-solid fa-sun text-3xl"></i>
			                <span className="font-bold">Light</span>
                        </div>
                    </button>
                    <button
                        className=""
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
                        <span className="font-bold text-lg">Set Light @</span>
                        <input type="time" className="border rounded-lg p-2"></input>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg">Set Dark @</span>
                        <input type="time" className="border rounded-lg p-2"></input>
                    </div>
                </div>

                <h2 className="font-bold text-2xl mb-2">Brightness</h2>
                <div className="flex gap-3 mb-8">
                    <input type="range" className="w-full"
                        min="0" max="100" value="50"></input>
                </div>

                <h2 className="font-bold text-2xl mb-2">Brightness Schedule</h2>
                <div className="flex flex-col gap-3 mb-8">
                    <div className="flex gap-2">
                        <input type="checkbox"></input>
                        <span className="font-bold text-lg">Use Schedule</span>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex flex-col">
                            <span className="font-bold text-lg">Set Bright @</span>
                            <input type="time" className="border rounded-lg p-2"></input>
                            <input type="number" className="border rounded-lg p-2"
                                min="0" max="100" step="1"></input>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg">Set Dim @</span>
                            <input type="time" className="border rounded-lg p-2"></input>
                            <input type="number" className="border rounded-lg p-2"
                                min="0" max="100" step="1"></input>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}