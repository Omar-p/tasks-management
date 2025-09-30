import { useState, useEffect } from "react";
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

interface TaskDetailModalProps {
  taskUuid: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityConfig: Record<TaskPriority, { variant: "default" | "warning" | "destructive"; label: string }> = {
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

export function TaskDetailModal({ taskUuid, open, onOpenChange }: TaskDetailModalProps) {
  const { data: task, isLoading } = useTask(taskUuid || "");
  const { updateTask } = useTaskMutations();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date(),
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
      });
    }
  }, [task]);

  const handleSave = async () => {
    if (!taskUuid) return;

    try {
      await updateTask.mutateAsync({
        uuid: taskUuid,
        taskData: {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          dueDate: formData.dueDate.toISOString(),
        },
      });
      toast.success("Task updated successfully!");
      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update task.";
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
                <>
                  {/* Title */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Status</label>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                      className="mt-1"
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Priority</label>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                      className="mt-1"
                    >
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Due Date</label>
                    <DatePicker
                      value={formData.dueDate}
                      onChange={(date) => date && setFormData({ ...formData, dueDate: date })}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        if (task) {
                          setFormData({
                            title: task.title,
                            description: task.description || "",
                            status: task.status,
                            priority: task.priority,
                            dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
                          });
                        }
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateTask.isPending}
                      className="flex-1"
                    >
                      {updateTask.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-muted">Status</label>
                    <p className={cn("text-lg font-semibold mt-1", statusConfig[task.status].color)}>
                      {statusConfig[task.status].label}
                    </p>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <div>
                      <label className="text-sm font-medium text-muted">Description</label>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}

                  {/* Due Date */}
                  {task.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-muted">Due Date</label>
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
                            new Date(task.dueDate) < new Date() && "text-red-500"
                          )}
                        >
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <span
                          className={cn(
                            "text-sm",
                            new Date(task.dueDate) < new Date() && "text-red-500 font-semibold"
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
                      <label className="text-sm font-medium text-muted">Assigned To</label>
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
                        <span className="text-sm">{task.assignedTo.username}</span>
                      </div>
                    </div>
                  )}

                  {/* Created By */}
                  {task.createdBy && (
                    <div>
                      <label className="text-sm font-medium text-muted">Created By</label>
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
                        <span className="text-sm">{task.createdBy.username}</span>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {task.createdAt && (
                      <div>
                        <label className="text-xs font-medium text-muted">Created</label>
                        <p className="text-xs mt-1">
                          {format(new Date(task.createdAt), "PPP p")}
                        </p>
                      </div>
                    )}
                    {task.updatedAt && (
                      <div>
                        <label className="text-xs font-medium text-muted">Last Updated</label>
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
