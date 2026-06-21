import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

interface FieldProps {
  label: string
  children: ReactNode
  hint?: string
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-slate-300">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-600 bg-slate-800/80 px-3 py-2.5 text-base text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20'

export function NumberInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      inputMode="decimal"
      className={`${inputClass} ${className}`}
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
      className="group rounded-2xl border border-slate-600/60 bg-slate-900/50 backdrop-blur"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-sky-300 select-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span className="text-slate-400 transition group-open:rotate-90">▶</span>
          {title}
        </span>
      </summary>
      <div className="border-t border-slate-700/60 px-4 py-4">{children}</div>
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
    <section
      className={`rounded-2xl border border-slate-600/60 bg-slate-900/60 p-4 shadow-xl backdrop-blur sm:p-5 ${className}`}
    >
      {title && <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>}
      {children}
    </section>
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
    primary: 'bg-sky-500 hover:bg-sky-400 text-slate-950',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    danger: 'bg-rose-600/90 hover:bg-rose-500 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-sky-300',
  }

  return (
    <button
      type="button"
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
        highlight ? 'bg-sky-500/15 text-sky-100' : 'bg-slate-800/50'
      }`}
    >
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`text-right font-semibold ${highlight ? 'text-sky-300' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}
