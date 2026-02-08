export default function Button({children, className, ...props}) {
    return (
        <button className={`bg-teal p-4 rounded-lg ${className}`} {...props}>{children}</button>
    );
}