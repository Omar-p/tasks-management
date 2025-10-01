import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Task, TaskPriority } from "@/services/tasks-api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Trash2, UserRound } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onDelete?: ((task: Task) => void) | undefined;
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

export function TaskCard({ task, onClick, onDelete }: TaskCardProps) {
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
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 flex-1">
            {task.title}
          </h3>
          <Badge
            variant={priorityInfo.variant}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
          >
            {priorityInfo.label}
          </Badge>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="h-8 w-8 flex items-center justify-center rounded-full text-muted hover:text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/40"
            aria-label="Delete task"
            title="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
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
