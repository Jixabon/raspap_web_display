export default function Metric({className = '', fillColor = 'bg-blue-400', value, percent = null, prefix = null, suffix = null}) {
    let fill = percent || value;
    return (
        <div className={`relative flex justify-center bg-dark-blue dark:bg-white rounded-lg h-6 ${className}`}>
            <div className={`absolute top-0 left-0 rounded-lg h-6 ${fillColor}`} style={{width: `${fill}%`}}></div>
            <span className="text-white mix-blend-difference z-10">{prefix && <>{prefix}</>}{value}{suffix && <>{suffix}</>}</span>
        </div>
    )
}