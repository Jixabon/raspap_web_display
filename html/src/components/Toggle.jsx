import { useState } from 'preact/hooks';

export default function Toggle({value, onChange, trueLabel, falseLabel}) {
    return (
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg bg-gray-200 dark:bg-teal p-1">
            <button
              onClick={() => {
                onChange(false);
              }}
              className={`px-6 py-1.5 text-sm font-medium rounded-lg transition ${
                !value ? 'bg-white dark:bg-dark-blue shadow-sm text-dark-blue dark:text-white' : 'text-dark-blue dark:text-white'
              }`}
            >
              {falseLabel}
            </button>
            <button
              onClick={() => {
                onChange(true);
              }}
              className={`px-6 py-1.5 text-sm font-medium rounded-lg transition ${
                value ? 'bg-white dark:bg-dark-blue shadow-sm text-dark-blue dark:text-white' : 'text-dark-blue dark:text-white'
              }`}
            >
              {trueLabel}
            </button>
          </div>
        </div>
    )
}