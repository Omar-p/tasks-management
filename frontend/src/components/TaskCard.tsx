import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Task, TaskPriority } from "@/services/tasks-api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const priorityConfig: Record<TaskPriority, { variant: "default" | "warning" | "destructive"; label: string }> = {
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
        "bg-surface rounded-lg p-4 shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm line-clamp-2">{task.title}</h3>
        <Badge variant={priorityInfo.variant} className="ml-2 shrink-0">
          {priorityInfo.label}
        </Badge>
      </div>

      {task.description && (
        <p className="text-xs text-muted mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        {task.dueDate && (
          <div className={cn("flex items-center gap-1", isOverdue && "text-red-500")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
          </div>
        )}
        {task.assignedTo && (
          <div className="flex items-center gap-1 text-muted ml-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            <span>{task.assignedTo.username}</span>
          </div>
        )}
      </div>
    </div>
  );
}