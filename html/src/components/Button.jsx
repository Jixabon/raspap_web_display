export function Button({children, className}) {
    return (
        <button className={`bg-teal p-4 rounded-lg ${className}`}>{children}</button>
    );
}