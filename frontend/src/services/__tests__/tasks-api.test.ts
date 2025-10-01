import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  tasksApi,
  TaskStatus,
  TaskPriority,
  type CreateTaskRequest,
  type UpdateTaskRequest,
} from "../tasks-api";
import { DEFAULT_API_BASE_URL } from "@/config/env";
import { createEmptyResponse, createJsonResponse } from "@/test/fetch-helpers";

const mockFetch = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = mockFetch;

describe("TasksAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();

    tasksApi.setTokenGetter(() => "test-token-123");
  });

  describe("getAllTasks", () => {
    it("should fetch all tasks successfully", async () => {
      const mockTasks = [
        {
          uuid: "task-1",
          title: "Test Task 1",
          description: "Description 1",
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
          dueDate: "2025-12-31T12:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockTasks));

      const result = await tasksApi.getAllTasks();

      expect(mockFetch).toHaveBeenCalledWith(`${DEFAULT_API_BASE_URL}/tasks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token-123",
        },
      });

      expect(result).toEqual(mockTasks);
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValueOnce(
        createJsonResponse({ message: "Server error" }, { status: 500 }),
      );

      await expect(tasksApi.getAllTasks()).rejects.toThrow("Server error");
    });
  });

  describe("getUserTasks", () => {
    it("should fetch user tasks without status filter", async () => {
      const mockTasks = [
        {
          uuid: "task-1",
          title: "My Task",
          description: "My task description",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          dueDate: "2025-12-31T12:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce(
        createJsonResponse({ content: mockTasks }),
      );

      const result = await tasksApi.getUserTasks();

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks/me`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          },
        },
      );

      expect(result).toEqual(mockTasks);
    });

    it("should fetch user tasks with status filter", async () => {
      const mockTasks = [
        {
          uuid: "task-1",
          title: "Completed Task",
          description: "Description",
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.LOW,
          dueDate: "2025-12-31T12:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce(
        createJsonResponse({ content: mockTasks }),
      );

      const result = await tasksApi.getUserTasks(TaskStatus.COMPLETED);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("status=COMPLETED");
      expect(result).toEqual(mockTasks);
    });
  });

  describe("getTaskByUuid", () => {
    it("should fetch task by uuid successfully", async () => {
      const mockTask = {
        uuid: "task-123",
        title: "Specific Task",
        description: "Task description",
        status: TaskStatus.PENDING,
        priority: TaskPriority.URGENT,
        dueDate: "2025-12-31T12:00:00Z",
      };

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockTask));

      const result = await tasksApi.getTaskByUuid("task-123");

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks/task-123`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          },
        },
      );

      expect(result).toEqual(mockTask);
    });

    it("should handle not found error", async () => {
      mockFetch.mockResolvedValueOnce(
        createJsonResponse({ message: "Task not found" }, { status: 404 }),
      );

      await expect(tasksApi.getTaskByUuid("non-existent")).rejects.toThrow(
        "Task not found",
      );
    });
  });

  describe("createTask", () => {
    it("should create task successfully", async () => {
      const taskData: CreateTaskRequest = {
        title: "New Task",
        description: "New task description",
        priority: TaskPriority.HIGH,
        dueDate: "2025-12-31T12:00:00Z",
      };

      const mockCreatedTask = {
        uuid: "new-task-123",
        ...taskData,
        status: TaskStatus.PENDING,
      };

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockCreatedTask));

      const result = await tasksApi.createTask(taskData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          },
          body: JSON.stringify(taskData),
        },
      );

      expect(result).toEqual(mockCreatedTask);
    });

    it("should handle validation errors", async () => {
      const taskData: CreateTaskRequest = {
        title: "",
        description: "",
        priority: TaskPriority.LOW,
        dueDate: "2025-12-31T12:00:00Z",
      };

      mockFetch.mockResolvedValueOnce(
        createJsonResponse({ message: "Validation failed" }, { status: 400 }),
      );

      await expect(tasksApi.createTask(taskData)).rejects.toThrow(
        "Validation failed",
      );
    });
  });

  describe("updateTask", () => {
    it("should update task successfully", async () => {
      const taskData: UpdateTaskRequest = {
        title: "Updated Task",
        status: TaskStatus.COMPLETED,
      };

      const mockUpdatedTask = {
        uuid: "task-123",
        title: "Updated Task",
        status: TaskStatus.COMPLETED,
      };

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockUpdatedTask));

      const result = await tasksApi.updateTask("task-123", taskData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks/task-123`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          },
          body: JSON.stringify(taskData),
        },
      );

      expect(result).toEqual(mockUpdatedTask);
    });

    it("should handle update error", async () => {
      const taskData: UpdateTaskRequest = {
        status: TaskStatus.CANCELLED,
      };

      mockFetch.mockResolvedValueOnce(
        createJsonResponse({ message: "Update failed" }, { status: 400 }),
      );

      await expect(tasksApi.updateTask("task-123", taskData)).rejects.toThrow(
        "Update failed",
      );
    });
  });

  describe("deleteTask", () => {
    it("should delete task successfully", async () => {
      mockFetch.mockResolvedValueOnce(createEmptyResponse({ status: 204 }));

      await tasksApi.deleteTask("task-123");

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/tasks/task-123`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          },
        },
      );
    });

    it("should handle delete error", async () => {
      mockFetch.mockResolvedValueOnce(
        createJsonResponse({ message: "Delete failed" }, { status: 404 }),
      );

      await expect(tasksApi.deleteTask("task-123")).rejects.toThrow(
        "Delete failed",
      );
    });
  });

  describe("token management", () => {
    it("should include authorization header when token is available", async () => {
      mockFetch.mockResolvedValueOnce(createJsonResponse([]));

      await tasksApi.getAllTasks();

      const [, options] = mockFetch.mock.calls[0];
      expect(options?.headers?.Authorization).toBe("Bearer test-token-123");
    });

    it("should not include authorization header when token is null", async () => {
      tasksApi.setTokenGetter(() => null);

      mockFetch.mockResolvedValueOnce(createJsonResponse([]));

      await tasksApi.getAllTasks();

      const [, options] = mockFetch.mock.calls[0];
      expect(options?.headers?.Authorization).toBeUndefined();
    });
  });
});
