import Header from '../components/Header';
import Footer from '../components/Footer';

export function NotFound() {
	return (
		<>
			<Header back={true} title="Not Found" />
			<main>
				<div className="mx-6">
					That page doesn't exist.
				</div>
			</main>
			<Footer />
		</>
	);
}
