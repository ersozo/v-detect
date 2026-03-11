export default function Toggle({
  enabled,
  onChange,
  label,
  description,
  className = "flex items-center justify-between p-3 bg-card rounded-lg border border-border-color",
  labelClassName = "block text-sm font-medium text-themed"
}) {
  return (
    <div className={className}>
      {(label || description) && (
        <div>
          {label && <label className={labelClassName}>{label}</label>}
          {description && <p className="text-xs text-themed-secondary">{description}</p>}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`${
          enabled ? 'bg-accent' : 'bg-slate-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
}
