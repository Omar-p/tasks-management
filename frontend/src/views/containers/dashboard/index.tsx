import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import { useAuth } from "@/contexts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreateTaskModal,
  TaskDetailModal,
  ThemeToggle,
} from "@/views/components";
import { useTaskMutations, useUserTasks } from "@/hooks/useTaskMutations";
import { TaskBoard } from "./TaskBoard";
import {
  TaskStatus,
  Task,
  TaskPriority,
  type PaginatedTasksResponse,
} from "@/services/tasks-api";
import { toast } from "sonner";
import type { CreateTaskFormData } from "@/lib/validation";

export const DashboardContainer = () => {
  const { user, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskUuid, setSelectedTaskUuid] = useState<string | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { createTask, updateTask, deleteTask } = useTaskMutations();

  const userTasksQuery = useUserTasks();
  const {
    data,
    isInitialLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = userTasksQuery;

  const paginatedTasks = data as
    | InfiniteData<PaginatedTasksResponse, number>
    | undefined;

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadMoreTasks = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (!hasNextPage) {
      return;
    }

    const root = scrollContainerRef.current ?? null;
    const sentinel = loadMoreRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreTasks();
        }
      },
      { root, rootMargin: "200px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasNextPage, loadMoreTasks, paginatedTasks?.pages.length]);

  const tasks: Task[] = useMemo(() => {
    if (!paginatedTasks) {
      return [];
    }
    return paginatedTasks.pages.flatMap((page) => page.content);
  }, [paginatedTasks]);

  const firstPageMeta: PaginatedTasksResponse["page"] | undefined =
    paginatedTasks?.pages && paginatedTasks.pages.length > 0
      ? paginatedTasks.pages[0].page
      : undefined;
  const latestPageMeta: PaginatedTasksResponse["page"] | undefined =
    paginatedTasks?.pages && paginatedTasks.pages.length > 0
      ? paginatedTasks.pages[paginatedTasks.pages.length - 1].page
      : undefined;

  const totalAvailableTasks = firstPageMeta?.totalElements ?? tasks.length;

  const pagePositionLabel = useMemo(() => {
    if (!latestPageMeta) return "";
    return ` · Page ${latestPageMeta.number + 1} of ${latestPageMeta.totalPages}`;
  }, [latestPageMeta]);

  const handleCreateTask = async (data: CreateTaskFormData) => {
    try {
      await createTask.mutateAsync({
        title: data.title,
        description: data.description,
        priority: data.priority as TaskPriority,
        dueDate: data.dueDate.toISOString(),
      });
      toast.success("Task created successfully!");
      setIsModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create task. Please try again.";
      toast.error(message);
      console.error("Create task error:", error);
    }
  };

  const handleTaskStatusUpdate = async (
    taskUuid: string,
    newStatus: TaskStatus,
  ) => {
    try {
      await updateTask.mutateAsync({
        uuid: taskUuid,
        taskData: { status: newStatus },
      });
      toast.success("Task status updated!");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update task status.";
      toast.error(message);
      console.error("Update task status error:", error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskUuid(task.uuid);
  };

  const handleTaskDeleteRequest = (task: Task) => {
    setTaskPendingDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setTaskPendingDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskPendingDelete) {
      return;
    }

    try {
      await deleteTask.mutateAsync(taskPendingDelete.uuid);
      if (selectedTaskUuid === taskPendingDelete.uuid) {
        setSelectedTaskUuid(null);
      }
      toast.success("Task deleted!");
      handleDeleteDialogOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete task. Please try again.";
      toast.error(message);
      console.error("Delete task error:", error);
    }
  };

  const { totalTasks, inProgressTasks, completedTasks } = useMemo(() => {
    const inProgress = tasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS,
    ).length;
    const completed = tasks.filter(
      (task) => task.status === TaskStatus.COMPLETED,
    ).length;

    return {
      totalTasks: totalAvailableTasks,
      inProgressTasks: inProgress,
      completedTasks: completed,
    };
  }, [tasks, totalAvailableTasks]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-surface overflow-hidden">
        <div className="w-full px-4 py-4 flex justify-between items-center gap-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary truncate min-w-0">
            Tasks Management
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <span className="text-textSecondary hidden lg:inline text-sm truncate">
              Welcome, {user?.username}
            </span>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
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
            <p className="text-3xl font-bold text-secondary">
              {inProgressTasks}
            </p>
          </div>

          <div className="bg-surface p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Completed</h2>
            <p className="text-3xl font-bold text-secondary">
              {completedTasks}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Tasks Board</h2>
          <Button onClick={() => setIsModalOpen(true)}>Create New Task</Button>
        </div>

        {isInitialLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted">Loading tasks...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto" ref={scrollContainerRef}>
              <div className="min-w-fit">
                <TaskBoard
                  tasks={tasks}
                  onTaskStatusUpdate={handleTaskStatusUpdate}
                  onTaskClick={handleTaskClick}
                  onTaskDelete={handleTaskDeleteRequest}
                />
                {hasNextPage && (
                  <div
                    ref={loadMoreRef}
                    className="h-4 w-full"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm text-muted">
              <span>
                Showing {tasks.length} of {totalAvailableTasks} tasks
                {pagePositionLabel}
              </span>
              <div className="flex items-center gap-3">
                {hasNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreTasks}
                    disabled={isFetchingNextPage}
                    className="whitespace-nowrap"
                  >
                    {isFetchingNextPage ? "Loading..." : "Load more"}
                  </Button>
                )}
              </div>
            </div>

            {isFetchingNextPage && (
              <div className="flex justify-center py-4 text-muted text-sm">
                Loading more tasks...
              </div>
            )}
          </>
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
        onDeleteRequest={handleTaskDeleteRequest}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {taskPendingDelete?.title ?? "this task"}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => handleDeleteDialogOpenChange(false)}
              disabled={deleteTask.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
