export default function Footer({version = '', uptime = ''}) {
    return (
        <footer className="flex justify-between w-full min-h-6 px-6 py-2 text-sm">
            <span>{version && (<>RaspAP v{version}</>)}</span>
            <span>{uptime}</span>
        </footer>
    );
}
