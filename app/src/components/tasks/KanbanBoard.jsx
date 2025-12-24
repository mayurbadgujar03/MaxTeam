import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { tasksApi } from '@/api/tasks';
import { TaskCard } from './TaskCard';
import { DraggableTaskCard } from './DraggableTaskCard';
import { DroppableColumn } from './DroppableColumn';
import { TaskDetailModal } from './TaskDetailModal';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const columns = [
  { id: 'todo', title: 'To Do', color: 'bg-muted' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
];

export function KanbanBoard({ tasks, projectId, onCreateTask, canManageTasks = false, currentUserId, currentUserRole, initialTaskId, onTaskModalClose }) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Open task from notification
  useEffect(() => {
    if (initialTaskId && tasks.length > 0) {
      const taskExists = tasks.find(t => t._id === initialTaskId);
      if (taskExists) {
        setSelectedTaskId(initialTaskId);
      }
    }
  }, [initialTaskId, tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksApi.update(projectId, taskId, { status }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['tasks', projectId], type: 'active' });
      toast({ title: 'Task moved' });
    },
    onError: (error) => {
      queryClient.refetchQueries({ queryKey: ['tasks', projectId], type: 'active' });
      toast({
        title: 'Permission denied',
        description: 'You do not have permission to move this task. Please contact your project admin.',
        variant: 'destructive',
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => tasksApi.delete(projectId, taskId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['tasks', projectId], type: 'active' });
      toast({ title: 'Task deleted' });
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete task',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDeleteTask = (taskId) => {
    setTaskToDelete(taskId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (!over) return;

    // Check if dragging over a column
    const overId = over.id;
    if (columns.find(col => col.id === overId)) {
      // Dragging over a column droppable
      return;
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    // Find which column the task is being dropped into
    const overColumn = columns.find(col => col.id === overId);
    
    if (overColumn) {
      // Dropped on a column - update task status
      const task = tasks.find(t => t._id === taskId);
      if (task && task.status !== overColumn.id) {
        // Check if user can move this specific task
        const canMoveTask = 
          currentUserRole === 'admin' || 
          currentUserRole === 'project_admin' || 
          (currentUserRole === 'member' && task.assignedTo?._id === currentUserId);
        
        if (canMoveTask) {
          updateTaskStatusMutation.mutate({ taskId, status: overColumn.id });
        }
      }
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  // Find the current task from the tasks array (updates when tasks change)
  const selectedTask = selectedTaskId ? tasks.find(t => t._id === selectedTaskId) : null;
  const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            
            return (
              <DroppableColumn
                key={column.id}
                id={column.id}
                className="flex w-80 flex-shrink-0 flex-col rounded-xl bg-muted/30"
              >
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', column.color)} />
                    <h3 className="text-sm font-medium">{column.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </div>
                  {canManageTasks && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onCreateTask(column.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-2 pt-0">
                  {columnTasks.map((task) => (
                    <DraggableTaskCard
                      key={task._id}
                      task={task}
                      onClick={() => setSelectedTaskId(task._id)}
                      onDelete={() => handleDeleteTask(task._id)}
                      canManageTasks={canManageTasks}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                    />
                  ))}
                  
                  {columnTasks.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-8 text-center">
                      <p className="text-xs text-muted-foreground">No tasks</p>
                    </div>
                  )}
                </div>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              onClick={() => {}}
              onDelete={() => {}}
              canManageTasks={canManageTasks}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        task={selectedTask}
        projectId={projectId}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTaskId(null);
            onTaskModalClose?.();
          }
        }}
        canManageTasks={canManageTasks}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action will also remove all subtasks and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteTaskMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
