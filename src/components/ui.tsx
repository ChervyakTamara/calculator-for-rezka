import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

interface FieldProps {
  label: string
  children: ReactNode
  hint?: string
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-neutral-500">{hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-none border border-neutral-400 bg-white px-2.5 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'

export function NumberInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      inputMode="decimal"
      className={`tabular-nums ${inputClass} ${className}`}
      {...props}
    />
  )
}

export function TextInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" className={`${inputClass} ${className}`} {...props} />
}

export function SelectInput({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      className="group border border-neutral-400 bg-white"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none border-b border-transparent bg-neutral-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-800 select-none group-open:border-neutral-300 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-3 text-center text-neutral-500 group-open:rotate-90">
            ›
          </span>
          {title}
        </span>
      </summary>
      <div className="border-t border-neutral-300 px-4 py-4">{children}</div>
    </details>
  )
}

export function Card({
  title,
  children,
  className = '',
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`border border-neutral-400 bg-white ${className}`}>
      {title && (
        <div className="border-b border-neutral-300 bg-neutral-100 px-4 py-2.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-800">
            {title}
          </h2>
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function SubsectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 border-b border-neutral-200 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
      {children}
    </h3>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}) {
  const variants = {
    primary:
      'border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 hover:border-neutral-800',
    secondary:
      'border border-neutral-400 bg-white text-neutral-900 hover:bg-neutral-50',
    danger:
      'border border-red-700 bg-white text-red-800 hover:bg-red-50',
    ghost:
      'border border-transparent bg-transparent text-neutral-700 underline-offset-2 hover:underline',
  }

  return (
    <button
      type="button"
      className={`rounded-none px-3 py-2 text-xs font-semibold uppercase tracking-wide transition disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function ResultTable({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <table className={`w-full border-collapse text-sm ${className}`}>
      <tbody>{children}</tbody>
    </table>
  )
}

export function ResultRow({
  label,
  value,
  highlight = false,
  total = false,
}: {
  label: string
  value: string
  highlight?: boolean
  total?: boolean
}) {
  return (
    <tr
      className={`border-b border-neutral-200 ${
        total
          ? 'border-t-2 border-t-neutral-900 bg-neutral-100'
          : highlight
            ? 'bg-neutral-50'
            : ''
      }`}
    >
      <td className="py-2 pr-4 text-neutral-600">{label}</td>
      <td
        className={`py-2 text-right tabular-nums ${
          total ? 'text-base font-bold text-neutral-900' : 'font-semibold text-neutral-900'
        }`}
      >
        {value}
      </td>
    </tr>
  )
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
}
