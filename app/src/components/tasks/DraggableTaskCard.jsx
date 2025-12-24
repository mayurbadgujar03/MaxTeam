import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';

export function DraggableTaskCard({ task, onClick, onDelete, canManageTasks, currentUserId, currentUserRole }) {
  const canDragTask = () => {
    if (currentUserRole === 'admin' || currentUserRole === 'project_admin') {
      return true;
    }
    
    if (currentUserRole === 'member') {
      return task.assignedTo?._id === currentUserId;
    }
    
    return false;
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    disabled: !canDragTask(),
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onClick={onClick}
        onDelete={onDelete}
        canManageTasks={canManageTasks}
      />
    </div>
  );
}
