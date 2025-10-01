import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { arrayMove } from "@dnd-kit/sortable";
import { Task, TaskStatus } from "@/services/tasks-api";
import { TaskColumn } from "@/components/TaskColumn";
import { TaskCard } from "@/components/TaskCard";

interface TaskBoardProps {
  tasks: Task[];
  onTaskStatusUpdate: (taskUuid: string, newStatus: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
}

const columns: { status: TaskStatus; title: string }[] = [
  { status: TaskStatus.PENDING, title: "To Do" },
  { status: TaskStatus.IN_PROGRESS, title: "In Progress" },
  { status: TaskStatus.COMPLETED, title: "Completed" },
  { status: TaskStatus.CANCELLED, title: "Cancelled" },
];

export function TaskBoard({
  tasks,
  onTaskStatusUpdate,
  onTaskClick,
  onTaskDelete,
}: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Update local tasks when server tasks change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find((t) => t.uuid === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = localTasks.find((t) => t.uuid === activeId);
    if (!activeTask) return;

    // If dragging over a task (reordering)
    const overTask = localTasks.find((t) => t.uuid === overId);
    if (overTask) {
      if (activeTask.status === overTask.status) {
        const oldIndex = localTasks.findIndex((t) => t.uuid === activeId);
        const newIndex = localTasks.findIndex((t) => t.uuid === overId);

        if (oldIndex !== newIndex) {
          setLocalTasks(arrayMove(localTasks, oldIndex, newIndex));
        }
      } else {
        // 👇 if task is dragged into a different column (over another task)
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.uuid === activeId ? { ...t, status: overTask.status } : t,
          ),
        );
      }
      return;
    }

    // If dragging directly over a column (empty space)
    if (Object.values(TaskStatus).includes(overId as TaskStatus)) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.uuid === activeId ? { ...t, status: newStatus } : t,
          ),
        );
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !activeTask) {
      setActiveTask(null);
      return;
    }

    const taskUuid = active.id as string;

    let newStatus: TaskStatus | null = null;

    // If dropped on a column
    if (Object.values(TaskStatus).includes(over.id as TaskStatus)) {
      newStatus = over.id as TaskStatus;
    } else {
      // If dropped on another task
      const overTask = localTasks.find((t) => t.uuid === over.id);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    // 👇 Compare against the ORIGINAL status, not the mutated local one
    if (newStatus && activeTask.status !== newStatus) {
      onTaskStatusUpdate(taskUuid, newStatus);
    }
    setActiveTask(null);
  };

  const tasksByStatus = columns.reduce(
    (acc, column) => {
      acc[column.status] = localTasks.filter(
        (task) => task.status === column.status,
      );
      return acc;
    },
    {} as Record<TaskStatus, Task[]>,
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      collisionDetection={rectIntersection}
    >
      <div className="flex w-full gap-6 pb-4 items-start">
        {columns.map((column) => (
          <TaskColumn
            key={column.status}
            status={column.status}
            title={column.title}
            tasks={tasksByStatus[column.status]}
            onTaskClick={onTaskClick}
            onTaskDelete={onTaskDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
