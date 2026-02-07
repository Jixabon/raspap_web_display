export default function RaspAPLogo({style = {}, className = '', animate = false}) {
    return (
        <svg
            style={style}
            className={className}
            viewBox="0 180 352 290"
            id="svg2"
            version="1.1">

            {animate && (<style>{`
                .wave {
                    opacity: 0.4;
                    animation: pulse 1.8s infinite;
                }
                .wave1 { animation-delay: 0.3s; }
                .wave2 { animation-delay: 0.6s; }

                @keyframes pulse {
                    0%   { opacity: 0.4; }
                    20%  { opacity: 1; }
                    60%  { opacity: 0.4; }
                    100% { opacity: 0.4; }
                }
            `}
            </style>)}

            <circle cx="128" cy="384" r="60" fill="currentColor"/>

            <circle cx="128" cy="384" r="100" fill="none" stroke="currentColor" stroke-width="25"/>

            <path className="wave wave1" d="M128 234 A 150 150 0 0 1 278 384" fill="none" stroke="currentColor" stroke-width="25"/>
            <path className="wave wave2" d="M128 184 A 200 200 0 0 1 328 384" fill="none" stroke="currentColor" stroke-width="25"/>
        </svg>
    )
}