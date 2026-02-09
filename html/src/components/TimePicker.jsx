// TimePickerModal.jsx
import { useState } from 'preact/hooks';

const TimePickerModal = ({ isOpen, onClose, onChange, initialTime = "12:00" }) => {
  const get12hTime = (h) => {
    const hour12 = h === 0 || h === 12 ? 12 : h % 12;
    const isPM = h >= 12;
    return { hour12, isPM };
  };

  let [iTHours, iTMinutes] = initialTime.split(':');
  let initialHours = Number.parseInt(iTHours);
  let initialMinutes = Number.parseInt(iTMinutes);

  const initial12h = get12hTime(initialHours || 12);


  const [mode, setMode] = useState('hours');
  const [hour24, setHour24] = useState(initialHours || 12);
  const [minutes, setMinutes] = useState(initialMinutes || 0);
  const [isPM, setIsPM] = useState(initial12h.isPM);

  const radius = 110;
  const center = 130;

  const getAngleFromEvent = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  };

  const handlePointerMove = (e) => {
    if (e.buttons !== 1) return;
    let angle = getAngleFromEvent(e);

    // Shift so 0° = top (12/0 position), clockwise
    let adjusted = (angle + 90) % 360;

    if (mode === 'hours') {
      let hourRaw = Math.round(adjusted / 30); // 30° per hour
      let h = hourRaw % 12;
      if (h === 0) h = 12;

      let hour24New = h;
      if (isPM && h !== 12) hour24New += 12;
      if (!isPM && h === 12) hour24New = 0;

      setHour24(hour24New);
    } else {
      // Minutes: 6° per minute
      let minRaw = Math.round(adjusted / 6);
      let min = minRaw % 60;
      setMinutes(min);
    }
  };

  const handlePointerUp = () => {
    if (mode === 'hours') setMode('minutes');
  };

  const handleDone = () => {
    onChange(`${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    onClose();
  };

  const { hour12 } = get12hTime(hour24);
  const formatDisplay = (val) => val.toString().padStart(2, '0');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-[320px] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Time display */}
        <div className="text-6xl font-light text-center mb-6 tracking-tight">
          <span
            className={`px-4 py-2 rounded-lg cursor-pointer ${
              mode === 'hours' ? 'bg-teal text-white' : 'text-gray-800'
            }`}
            onClick={() => setMode('hours')}
          >
            {formatDisplay(hour12)}
          </span>
          <span className="mx-1">:</span>
          <span
            className={`px-4 py-2 rounded-lg cursor-pointer ${
              mode === 'minutes' ? 'bg-teal text-white' : 'text-gray-800'
            }`}
            onClick={() => setMode('minutes')}
          >
            {formatDisplay(minutes)}
          </span>
        </div>

        {/* AM/PM */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-gray-200 p-1">
            <button
              onClick={() => {
                setIsPM(false);
                if (hour24 >= 12) setHour24(hour24 - 12);
              }}
              className={`px-6 py-1.5 text-sm font-medium rounded-lg transition ${
                !isPM ? 'bg-white shadow-sm text-dark-blue' : 'text-gray-600'
              }`}
            >
              AM
            </button>
            <button
              onClick={() => {
                setIsPM(true);
                if (hour24 < 12) setHour24(hour24 + 12);
              }}
              className={`px-6 py-1.5 text-sm font-medium rounded-lg transition ${
                isPM ? 'bg-white shadow-sm text-dark-blue' : 'text-gray-600'
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Clock face */}
        <div
          className="relative w-[260px] h-[260px] mx-auto mb-8 rounded-full bg-gray-100 select-none touch-none"
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="absolute w-3 h-3 bg-teal rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20" />

          {/* Markers */}
          {Array.from({ length: 12 }).map((_, i) => {
            const isHours = mode === 'hours';
            const value = isHours ? (i === 0 ? 12 : i) : i * 5;
            const angle = (i * 360) / 12;
            const isSelected = isHours
              ? value === hour12
              : value === minutes - (minutes % 5);

            const rad = ((angle - 90) * Math.PI) / 180;
            const x = center + radius * 0.90 * Math.cos(rad);
            const y = center + radius * 0.90 * Math.sin(rad);

            return (
              <div
                key={i}
                className={`absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center text-sm pointer-events-none z-20 rounded-full shadow-sm ${
                  isSelected
                    ? 'bg-teal text-white font-medium shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                    : 'bg-white text-gray-700 shadow-inner'
                }`}
                style={{ left: `${x}px`, top: `${y}px` }}
              >
                {value}
              </div>
            );
          })}

          {/* Hand */}
          {(() => {
            const value = mode === 'hours' ? hour12 : minutes;
            const max = mode === 'hours' ? 12 : 60;
            const angleDeg = (value / max) * 360 - 90;
            const length = radius * 0.78; // mode === 'hours' ? radius * 0.52 : radius * 0.78;

            return (
              <div
                className="absolute w-1 bg-teal rounded-t-full left-1/2 top-1/2 -translate-x-1/2 shadow-md z-10 origin-top"
                style={{
                  height: `${length}px`,
                  transform: `rotate(${angleDeg - 90}deg)`,
                }}
              />
            );
          })()}
        </div>

        {/* Buttons */}
        <div className="flex justify-between gap-4 mt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 font-medium rounded-lg border border-teal"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-6 py-2.5 bg-teal text-white font-medium rounded-lg"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimePickerModal;