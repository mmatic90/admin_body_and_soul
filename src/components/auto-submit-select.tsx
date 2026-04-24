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

export default function AutoSubmitSelect({
  label,
  action,
  name,
  value,
  options,
  hiddenFields = {},
}: Props) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">
        {label}
      </label>

      <form action={action}>
        {Object.entries(hiddenFields).map(([key, val]) => (
          <input key={key} type="hidden" name={key} value={val} />
        ))}

        <select
          name={name}
          defaultValue={value}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="w-full rounded-xl border border-app-soft px-4 py-3 outline-none"
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
