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
import { Task, TaskPriority, TaskStatus } from "@/services/tasks-api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateTaskSchema, type UpdateTaskFormData } from "@/lib/validation";
import { Pencil, Trash2 } from "lucide-react";

interface TaskDetailModalProps {
  taskUuid: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteRequest?: (task: Task) => void;
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

const statusDisplayConfig: Record<
  TaskStatus,
  { label: string; colorClass: string; badgeClass: string }
> = {
  [TaskStatus.PENDING]: {
    label: "To Do",
    colorClass: "text-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    colorClass: "text-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  },
  [TaskStatus.COMPLETED]: {
    label: "Completed",
    colorClass: "text-green-600",
    badgeClass: "bg-green-500/10 text-green-600 border border-green-500/20",
  },
  [TaskStatus.CANCELLED]: {
    label: "Cancelled",
    colorClass: "text-slate-400",
    badgeClass: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  },
};

export function TaskDetailModal({
  taskUuid,
  open,
  onOpenChange,
  onDeleteRequest,
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
              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-semibold leading-tight">
                    {isEditing ? "Edit Task" : task.title}
                  </DialogTitle>
                  {!isEditing && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge
                        variant={priorityConfig[task.priority].variant}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {priorityConfig[task.priority].label}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {!isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                  )}
                  {!isEditing && onDeleteRequest && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => onDeleteRequest(task)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete
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
                      {Object.entries(statusDisplayConfig).map(
                        ([key, config]) => (
                          <option key={key} value={key}>
                            {config.label}
                          </option>
                        ),
                      )}
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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                          statusDisplayConfig[task.status].badgeClass,
                        )}
                      >
                        <span
                          className="h-2 w-2 rounded-full bg-current"
                          aria-hidden="true"
                        />
                        {statusDisplayConfig[task.status].label}
                      </span>
                    </div>
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
