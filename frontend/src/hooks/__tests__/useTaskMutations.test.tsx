import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTaskMutations, useUserTasks } from "../useTaskMutations";
import { TestWrapper } from "@/test-utils";
import { TaskPriority, TaskStatus } from "@/services/tasks-api";
import { createEmptyResponse, createJsonResponse } from "@/test/fetch-helpers";

const fetchMock = vi.fn();

const mockTask = {
  uuid: "task-123",
  title: "Task Title",
  description: "Task description",
  status: TaskStatus.PENDING,
  priority: TaskPriority.MEDIUM,
  dueDate: "2025-12-31T12:00:00Z",
};

describe("useTaskMutations - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = fetchMock;
  });

  describe("createTask mutation", () => {
    it("should create task successfully", async () => {
      const mockTaskData = {
        title: "New Task",
        description: "Task description",
        priority: TaskPriority.HIGH,
        dueDate: "2025-12-31T12:00:00Z",
      };

      const mockCreatedTask = {
        uuid: "task-123",
        ...mockTaskData,
        status: TaskStatus.PENDING,
      };

      fetchMock.mockResolvedValueOnce(createJsonResponse(mockCreatedTask));

      const { result } = renderHook(() => useTaskMutations(), {
        wrapper: TestWrapper,
      });

      result.current.createTask.mutate(mockTaskData);

      await waitFor(() => {
        expect(result.current.createTask.isSuccess).toBe(true);
      });

      expect(result.current.createTask.data).toEqual(mockCreatedTask);
    });

    it("should handle create task error", async () => {
      const mockTaskData = {
        title: "",
        description: "",
        priority: TaskPriority.LOW,
        dueDate: "2025-12-31T12:00:00Z",
      };

      fetchMock.mockResolvedValueOnce(
        createJsonResponse({ message: "Validation failed" }, { status: 400 }),
      );

      const { result } = renderHook(() => useTaskMutations(), {
        wrapper: TestWrapper,
      });

      result.current.createTask.mutate(mockTaskData);

      await waitFor(() => {
        expect(result.current.createTask.isError).toBe(true);
      });
    });
  });

  describe("updateTask mutation", () => {
    it("should update task successfully", async () => {
      const mockUpdateData = {
        uuid: "task-123",
        taskData: {
          status: TaskStatus.IN_PROGRESS,
        },
      };

      const mockUpdatedTask = {
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      };

      fetchMock.mockResolvedValueOnce(createJsonResponse(mockUpdatedTask));

      const { result } = renderHook(() => useTaskMutations(), {
        wrapper: TestWrapper,
      });

      result.current.updateTask.mutate(mockUpdateData);

      await waitFor(() => {
        expect(result.current.updateTask.isSuccess).toBe(true);
      });

      expect(result.current.updateTask.data).toEqual(mockUpdatedTask);
    });

    it("should handle update task not found error", async () => {
      const mockUpdateData = {
        uuid: "non-existent-task",
        taskData: {
          status: TaskStatus.COMPLETED,
        },
      };

      fetchMock.mockResolvedValueOnce(
        createJsonResponse({ message: "Task not found" }, { status: 404 }),
      );

      const { result } = renderHook(() => useTaskMutations(), {
        wrapper: TestWrapper,
      });

      result.current.updateTask.mutate(mockUpdateData);

      await waitFor(() => {
        expect(result.current.updateTask.isError).toBe(true);
      });
    });
  });

  describe("deleteTask mutation", () => {
    it("should delete task successfully", async () => {
      fetchMock.mockResolvedValueOnce(createEmptyResponse({ status: 204 }));

      const { result } = renderHook(() => useTaskMutations(), {
        wrapper: TestWrapper,
      });

      result.current.deleteTask.mutate("task-123");

      await waitFor(() => {
        expect(result.current.deleteTask.isSuccess).toBe(true);
      });
    });

    it("should handle delete task error", async () => {
      fetchMock.mockResolvedValueOnce(
        createJsonResponse({ message: "Forbidden" }, { status: 403 }),
      );

      const { result } = renderHook(() => useTaskMutations(), {
        wrapper: TestWrapper,
      });

      result.current.deleteTask.mutate("task-123");

      await waitFor(() => {
        expect(result.current.deleteTask.isError).toBe(true);
      });
    });
  });

  describe("useUserTasks query", () => {
    it("should fetch user tasks successfully", async () => {
      const mockTasks = {
        content: [
          {
            uuid: "task-1",
            title: "Task 1",
            status: TaskStatus.PENDING,
            priority: TaskPriority.HIGH,
            dueDate: "2025-12-31T12:00:00Z",
          },
          {
            uuid: "task-2",
            title: "Task 2",
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.MEDIUM,
            dueDate: "2025-12-30T12:00:00Z",
          },
        ],
      };

      fetchMock.mockResolvedValueOnce(createJsonResponse(mockTasks));

      const { result } = renderHook(() => useUserTasks(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTasks.content);
    });

    it("should handle fetch tasks error", async () => {
      fetchMock.mockResolvedValueOnce(
        createJsonResponse({ message: "Failed" }, { status: 500 }),
      );

      const { result } = renderHook(() => useUserTasks(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
