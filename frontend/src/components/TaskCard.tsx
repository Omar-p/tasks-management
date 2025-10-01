import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Task, TaskPriority } from "@/services/tasks-api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, UserRound } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
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

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
  };

  const priorityInfo = priorityConfig[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-surface rounded-lg p-4 shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow touch-none select-none",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm line-clamp-2">{task.title}</h3>
        <Badge variant={priorityInfo.variant} className="ml-2 shrink-0">
          {priorityInfo.label}
        </Badge>
      </div>

      {task.description && (
        <p className="text-xs text-muted mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs">
        {task.dueDate && (
          <div
            className={cn(
              "flex items-center gap-1",
              isOverdue && "text-red-500",
            )}
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
          </div>
        )}
        {task.assignedTo && (
          <div className="flex items-center gap-1 text-muted ml-auto">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{task.assignedTo.username}</span>
          </div>
        )}
      </div>
    </div>
  );
}
