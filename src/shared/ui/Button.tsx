import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-500 text-white shadow-md shadow-brand-500/30 active:bg-brand-600',
  ghost: 'bg-white text-ink ring-1 ring-black/10 active:bg-black/5',
  danger: 'bg-white text-red-600 ring-1 ring-red-200 active:bg-red-50',
}

/** Bouton principal de l'appli : grand (48 px mini) pour être tapé au pouce. */
export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-12 rounded-2xl px-5 text-base font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
