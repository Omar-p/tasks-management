import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CreateTaskModal, TaskDetailModal, ThemeToggle } from '@/views/components';
import { useTaskMutations, useUserTasks } from '@/hooks/useTaskMutations';
import { TaskBoard } from './TaskBoard';
import { TaskStatus, Task, TaskPriority } from '@/services/tasks-api';
import { toast } from 'sonner';
import type { CreateTaskFormData } from '@/lib/validation';

export const DashboardContainer = () => {
  const { user, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskUuid, setSelectedTaskUuid] = useState<string | null>(null);
  const { createTask, updateTask } = useTaskMutations();

  const { data: tasks = [], isLoading } = useUserTasks();

  const handleCreateTask = async (data: CreateTaskFormData) => {
    try {
      await createTask.mutateAsync({
        title: data.title,
        description: data.description,
        priority: data.priority as TaskPriority,
        dueDate: data.dueDate.toISOString(),
      });
      toast.success('Task created successfully!');
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create task. Please try again.';
      toast.error(message);
      console.error('Create task error:', error);
    }
  };

  const handleTaskStatusUpdate = async (taskUuid: string, newStatus: TaskStatus) => {
    try {
      await updateTask.mutateAsync({
        uuid: taskUuid,
        taskData: { status: newStatus },
      });
      toast.success('Task status updated!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task status.';
      toast.error(message);
      console.error('Update task status error:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskUuid(task.uuid);
  };

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length;
  const completedTasks = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-surface overflow-hidden">
        <div className="w-full px-4 py-4 flex justify-between items-center gap-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary truncate min-w-0">Tasks Management</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <span className="text-textSecondary hidden lg:inline text-sm truncate">Welcome, {user?.username}</span>
            <Button onClick={logout} variant="outline" size="sm" className="whitespace-nowrap">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Total Tasks</h2>
            <p className="text-3xl font-bold text-primary">{totalTasks}</p>
          </div>

          <div className="bg-surface p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">In Progress</h2>
            <p className="text-3xl font-bold text-secondary">{inProgressTasks}</p>
          </div>

          <div className="bg-surface p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Completed</h2>
            <p className="text-3xl font-bold text-secondary">{completedTasks}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Tasks Board</h2>
          <Button onClick={() => setIsModalOpen(true)}>Create New Task</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted">Loading tasks...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TaskBoard
              tasks={tasks}
              onTaskStatusUpdate={handleTaskStatusUpdate}
              onTaskClick={handleTaskClick}
            />
          </div>
        )}
      </main>

      <CreateTaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateTask}
        isLoading={createTask.isPending}
      />

      <TaskDetailModal
        taskUuid={selectedTaskUuid}
        open={!!selectedTaskUuid}
        onOpenChange={(open) => !open && setSelectedTaskUuid(null)}
      />
    </div>
  );
};