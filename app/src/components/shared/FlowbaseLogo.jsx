import { cn } from '@/lib/utils';

const sizes = {
  sm: { text: 'text-xl', icon: 'h-7 w-7', gap: 'gap-2' },
  md: { text: 'text-2xl', icon: 'h-8 w-8', gap: 'gap-2.5' },
  lg: { text: 'text-3xl', icon: 'h-10 w-10', gap: 'gap-3' },
};

export function FlowbaseLogo({ size = 'sm', className }) {
  const s = sizes[size] || sizes.sm;

  return (
    <div className={cn('flex items-center', s.gap, className)}>
      {/* Air-wavy SVG icon */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className={cn(s.icon, 'shrink-0')}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="flowbase-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        {/* Three flowing air-wave paths stacked vertically */}
        <path
          d="M4 10 C8 6, 12 14, 16 10 C20 6, 24 14, 28 10"
          stroke="url(#flowbase-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M4 16 C8 12, 12 20, 16 16 C20 12, 24 20, 28 16"
          stroke="url(#flowbase-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.65"
        />
        <path
          d="M4 22 C8 18, 12 26, 16 22 C20 18, 24 26, 28 22"
          stroke="url(#flowbase-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
      </svg>

      {/* Gradient text */}
      <span
        className={cn(
          s.text,
          'font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-blue-600 bg-clip-text text-transparent select-none'
        )}
      >
        Flowbase
      </span>
    </div>
  );
}
