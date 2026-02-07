import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { NotFound } from './pages/_404.jsx';
import { Dashboard } from './pages/Dashboard/index.jsx';
import { System } from './pages/System/index.jsx';
import { Settings } from './pages/Settings/index.jsx';

export function App() {
	return (
		<LocationProvider>
			<Router>
				<Route path="/" component={Dashboard} />
				<Route path="/system" component={System} />
				<Route path="/settings" component={Settings} />
				<Route default component={NotFound} />
			</Router>
		</LocationProvider>
	);
}

render(<App />, document.getElementById('app'));
