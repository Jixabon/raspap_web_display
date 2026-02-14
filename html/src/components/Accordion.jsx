export default function Accordion({ children, label }) {
    return (
        <details className="group border rounded">
            <summary className="flex justify-between items-center rounded px-4 py-2 text-2xl">
                <span>{label}</span>
                <span>
                    <i className="fa-solid fa-plus group-open:!hidden"></i>
                    <i className="fa-solid fa-minus !hidden group-open:!inline-block"></i>
                </span>
            </summary>

            {children}
        </details>
    )
}