import { cn } from '@/lib/utils';

const sizes = {
  sm: { text: 'text-xl', icon: 'h-7 w-7', gap: 'gap-2' },
  md: { text: 'text-2xl', icon: 'h-8 w-8', gap: 'gap-2.5' },
  lg: { text: 'text-3xl', icon: 'h-10 w-10', gap: 'gap-3' },
};

export function FlowbaseLogo({ size = 'sm', className, textClassName }) {
  const s = sizes[size] || sizes.sm;

  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <img
        src="/logo_tab_icon.png"
        alt="Flowbase Logo"
        className={cn(s.icon, 'shrink-0 object-contain')}
      />

      {/* Gradient text */}
      <span
        className={cn(
          s.text,
          'font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-blue-600 bg-clip-text text-transparent select-none',
          textClassName
        )}
      >
        Flowbase
      </span>
    </div>
  );
}
