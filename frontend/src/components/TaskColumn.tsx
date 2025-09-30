import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task, TaskStatus } from "@/services/tasks-api";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick?: ((task: Task) => void) | undefined;
}

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: "border-t-blue-500",
  [TaskStatus.IN_PROGRESS]: "border-t-yellow-500",
  [TaskStatus.COMPLETED]: "border-t-green-500",
  [TaskStatus.CANCELLED]: "border-t-gray-500",
};

export function TaskColumn({
  status,
  title,
  tasks,
  onTaskClick,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const taskIds = tasks.map((task) => task.uuid);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-surface-alt rounded-lg p-4 border-t-4 border-l border-r border-b border-border min-h-[500px] w-80",
        statusColors[status],
        isOver && "ring-2 ring-primary",
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-base">{title}</h2>
        <span className="text-xs bg-background px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 flex-1">
          {tasks.map((task) => (
            <TaskCard
              key={task.uuid}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </div>
      </SortableContext>

      {tasks.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted text-sm">
          No tasks
        </div>
      )}
    </div>
  );
}
