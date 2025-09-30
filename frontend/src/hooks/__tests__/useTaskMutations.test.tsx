import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTaskMutations, useUserTasks } from "../useTaskMutations";
import { TestWrapper } from "@/test-utils";
import { TaskStatus, TaskPriority } from "@/services/tasks-api";

// Mock fetch globally
global.fetch = vi.fn();

describe("useTaskMutations - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      // Mock successful create
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockCreatedTask,
        headers: new Headers(),
      });

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

      // Mock validation error
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: "Validation failed",
          fieldErrors: {
            title: "Title is required",
          },
        }),
        headers: new Headers(),
      });

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
        uuid: "task-123",
        title: "Task Title",
        description: "Task description",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: "2025-12-31T12:00:00Z",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-02T00:00:00Z",
      };

      // Mock successful update
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedTask,
        headers: new Headers(),
      });

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

      // Mock 404 error
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: "Task not found" }),
        headers: new Headers(),
      });

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
      const taskUuid = "task-123";

      // Mock successful delete
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const { result } = renderHook(() => useTaskMutations(), {
        wrapper: TestWrapper,
      });

      result.current.deleteTask.mutate(taskUuid);

      await waitFor(() => {
        expect(result.current.deleteTask.isSuccess).toBe(true);
      });
    });

    it("should handle delete task error", async () => {
      const taskUuid = "task-123";

      // Mock error
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: "Forbidden" }),
        headers: new Headers(),
      });

      const { result } = renderHook(() => useTaskMutations(), {
        wrapper: TestWrapper,
      });

      result.current.deleteTask.mutate(taskUuid);

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
        totalElements: 2,
        totalPages: 1,
        size: 20,
        number: 0,
      };

      // Mock successful fetch
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
        headers: new Headers(),
      });

      const { result } = renderHook(() => useUserTasks(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTasks.content);
      expect(result.current.data).toHaveLength(2);
    });

    it("should handle fetch tasks error", async () => {
      // Mock error
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
        headers: new Headers(),
      });

      const { result } = renderHook(() => useUserTasks(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
