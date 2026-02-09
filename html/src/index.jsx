import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { NotFound } from './pages/_404.jsx';
import { Dashboard } from './pages/Dashboard/index.jsx';
import { Connection } from './pages/Connection/index.jsx';
import { AP } from './pages/AP/index.jsx';
import { System } from './pages/System/index.jsx';
import { Settings } from './pages/Settings/index.jsx';

export function App() {
	// Set Schedule Theme (every min)
	const themeScheduleInterval = setInterval(setThemeBySchedule, 60 * 1000);
	// init theme
	setThemeBySchedule();

	return (
		<LocationProvider>
			<Router>
				<Route path="/" component={Dashboard} />
				<Route path="/connection" component={Connection} />
				<Route path="/access-point" component={AP} />
				<Route path="/system" component={System} />
				<Route path="/settings" component={Settings} />
				<Route default component={NotFound} />
			</Router>
		</LocationProvider>
	);
}

render(<App />, document.getElementById('app'));

export function setThemeBySchedule() {
	let now = new Date();
	let minutesOfDay = now.getHours() * 60 + now.getMinutes();

	// defaults to 6am and 6pm
	let setLightMinutes = Number.parseInt(localStorage.getItem('lightMinutes')) || 360;
	let setDarkMinutes = Number.parseInt(localStorage.getItem('darkMinutes')) || 1080;

	if (minutesOfDay >= setLightMinutes && minutesOfDay < setDarkMinutes) {
		localStorage.scheduleTheme = 'light';
	} else if (minutesOfDay >= setDarkMinutes || minutesOfDay < setLightMinutes) {
		localStorage.scheduleTheme = 'dark';
	}

	document.documentElement.classList.toggle(
		"dark",
		localStorage.theme === "dark" ||
			(!("theme" in localStorage) && localStorage.getItem('scheduleTheme') === 'dark'),
	);
}