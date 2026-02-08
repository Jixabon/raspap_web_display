export default function Overlay({ show, children }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm"
                // onClick={onClose}
            />

            <div className="relative animate-fade-in">
                {children}
            </div>
        </div>
    );
}
