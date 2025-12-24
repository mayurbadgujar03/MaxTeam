import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

export function DroppableColumn({ id, children, className }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {children}
    </div>
  );
}
