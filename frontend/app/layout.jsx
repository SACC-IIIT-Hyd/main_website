import ClientTitleUpdater from './ClientTitleUpdater';

const Rootlayout = ({ children }) => {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/favicon.ico" />
			</head>
			<body>
				<ClientTitleUpdater />
				<div className="main">
					<div className="gradient" />

				</div>
				<main className="app">
					{children}
				</main>
			</body>
		</html>
	)
}

export default Rootlayout