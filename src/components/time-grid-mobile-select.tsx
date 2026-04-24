"use client";

type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  action: string;
  name: string;
  value: string;
  options: Option[];
  hiddenFields?: Record<string, string>;
};

export default function TimeGridMobileSelect({
  label,
  action,
  name,
  value,
  options,
  hiddenFields = {},
}: Props) {
  return (
    <div className="space-y-1 lg:hidden">
      <label className="block text-sm font-medium text-app-text">{label}</label>

      <form action={action}>
        {Object.entries(hiddenFields).map(([key, val]) => (
          <input key={key} type="hidden" name={key} value={val} />
        ))}

        <select
          name={name}
          defaultValue={value}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="w-full rounded-xl border border-app-soft bg-white px-4 py-3 text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}
