import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useTask, useTaskMutations } from "@/hooks/useTaskMutations";
import { TaskPriority, TaskStatus } from "@/services/tasks-api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateTaskSchema, type UpdateTaskFormData } from "@/lib/validation";

interface TaskDetailModalProps {
  taskUuid: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityConfig: Record<
  TaskPriority,
  { variant: "default" | "warning" | "destructive"; label: string }
> = {
  [TaskPriority.LOW]: { variant: "default", label: "Low" },
  [TaskPriority.MEDIUM]: { variant: "default", label: "Medium" },
  [TaskPriority.HIGH]: { variant: "warning", label: "High" },
  [TaskPriority.URGENT]: { variant: "destructive", label: "Urgent" },
};

const statusConfig = {
  PENDING: { label: "To Do", color: "text-blue-500" },
  IN_PROGRESS: { label: "In Progress", color: "text-yellow-500" },
  COMPLETED: { label: "Completed", color: "text-green-500" },
  CANCELLED: { label: "Cancelled", color: "text-gray-500" },
};

export function TaskDetailModal({
  taskUuid,
  open,
  onOpenChange,
}: TaskDetailModalProps) {
  const { data: task, isLoading } = useTask(taskUuid || "");
  const { updateTask } = useTaskMutations();

  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UpdateTaskFormData>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(),
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: UpdateTaskFormData) => {
    if (!taskUuid) return;

    try {
      await updateTask.mutateAsync({
        uuid: taskUuid,
        taskData: {
          title: data.title,
          description: data.description || "",
          status: data.status as TaskStatus,
          priority: data.priority as TaskPriority,
          dueDate: data.dueDate.toISOString(),
        },
      });
      toast.success("Task updated successfully!");
      setIsEditing(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update task.";
      toast.error(message);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-muted">Loading task details...</p>
          </div>
        ) : task ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-2xl">
                  {isEditing ? "Edit Task" : task.title}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Badge variant={priorityConfig[task.priority].variant}>
                      {priorityConfig[task.priority].label}
                    </Badge>
                  )}
                  {!isEditing && (
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Title
                    </label>
                    <Input
                      {...register("title")}
                      disabled={updateTask.isPending}
                      className={cn(
                        "mt-1",
                        errors.title && "border-destructive",
                      )}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <span>⚠️</span>
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Description
                    </label>
                    <Textarea
                      {...register("description")}
                      disabled={updateTask.isPending}
                      className={cn(
                        "mt-1 min-h-[100px]",
                        errors.description && "border-destructive",
                      )}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <span>⚠️</span>
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Status
                    </label>
                    <Select
                      {...register("status")}
                      disabled={updateTask.isPending}
                      className={cn(
                        "mt-1",
                        errors.status && "border-destructive",
                      )}
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <span>⚠️</span>
                        {errors.status.message}
                      </p>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Priority
                    </label>
                    <Select
                      {...register("priority")}
                      disabled={updateTask.isPending}
                      className={cn(
                        "mt-1",
                        errors.priority && "border-destructive",
                      )}
                    >
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </Select>
                    {errors.priority && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <span>⚠️</span>
                        {errors.priority.message}
                      </p>
                    )}
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Due Date
                    </label>
                    <DatePicker
                      value={watch("dueDate")}
                      onChange={(date) => date && setValue("dueDate", date)}
                    />
                    {errors.dueDate && (
                      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                        <span>⚠️</span>
                        {errors.dueDate.message}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        if (task) {
                          reset({
                            title: task.title,
                            description: task.description || "",
                            status: task.status,
                            priority: task.priority,
                            dueDate: task.dueDate
                              ? new Date(task.dueDate)
                              : new Date(),
                          });
                        }
                      }}
                      disabled={updateTask.isPending}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateTask.isPending}
                      className="flex-1"
                    >
                      {updateTask.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-muted">
                      Status
                    </label>
                    <p
                      className={cn(
                        "text-lg font-semibold mt-1",
                        statusConfig[task.status].color,
                      )}
                    >
                      {statusConfig[task.status].label}
                    </p>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Description
                      </label>
                      <p className="mt-1 text-sm whitespace-pre-wrap">
                        {task.description}
                      </p>
                    </div>
                  )}

                  {/* Due Date */}
                  {task.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Due Date
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn(
                            new Date(task.dueDate) < new Date() &&
                              "text-red-500",
                          )}
                        >
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <span
                          className={cn(
                            "text-sm",
                            new Date(task.dueDate) < new Date() &&
                              "text-red-500 font-semibold",
                          )}
                        >
                          {format(new Date(task.dueDate), "PPP p")}
                          {new Date(task.dueDate) < new Date() && " (Overdue)"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Assigned To */}
                  {task.assignedTo && (
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Assigned To
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span className="text-sm">
                          {task.assignedTo.username}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Created By */}
                  {task.createdBy && (
                    <div>
                      <label className="text-sm font-medium text-muted">
                        Created By
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span className="text-sm">
                          {task.createdBy.username}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {task.createdAt && (
                      <div>
                        <label className="text-xs font-medium text-muted">
                          Created
                        </label>
                        <p className="text-xs mt-1">
                          {format(new Date(task.createdAt), "PPP p")}
                        </p>
                      </div>
                    )}
                    {task.updatedAt && (
                      <div>
                        <label className="text-xs font-medium text-muted">
                          Last Updated
                        </label>
                        <p className="text-xs mt-1">
                          {format(new Date(task.updatedAt), "PPP p")}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center py-8">
            <p className="text-muted">Task not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
