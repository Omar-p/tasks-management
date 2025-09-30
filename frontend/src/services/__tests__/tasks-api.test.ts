import { describe, it, expect, vi, beforeEach } from "vitest";
import { tasksApi, TaskStatus, TaskPriority, type CreateTaskRequest, type UpdateTaskRequest } from "../tasks-api";
import { DEFAULT_API_BASE_URL } from "@/config/env";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("TasksAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();

    // Set up token getter for tests
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
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
          createdBy: { uuid: "user-1", username: "creator" },
          assignedTo: { uuid: "user-2", username: "assignee" },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTasks),
      });

      const result = await tasksApi.getAllTasks();

      expect(mockFetch).toHaveBeenCalledWith(`${DEFAULT_API_BASE_URL}/tasks`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token-123",
        },
      });

      expect(result).toEqual(mockTasks);
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: "Server error" }),
      });

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
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
          createdBy: { uuid: "user-1", username: "me" },
          assignedTo: { uuid: "user-1", username: "me" },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTasks),
      });

      const result = await tasksApi.getUserTasks();

      expect(mockFetch).toHaveBeenCalledWith(`${DEFAULT_API_BASE_URL}/tasks/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token-123",
        },
      });

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
          createdAt: "2025-01-01T10:00:00Z",
          updatedAt: "2025-01-01T10:00:00Z",
          createdBy: { uuid: "user-1", username: "me" },
          assignedTo: { uuid: "user-1", username: "me" },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTasks),
      });

      const result = await tasksApi.getUserTasks(TaskStatus.COMPLETED);

      expect(mockFetch.mock.calls[0][0]).toContain("status=COMPLETED");
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
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
        createdBy: { uuid: "user-1", username: "creator" },
        assignedTo: { uuid: "user-2", username: "assignee" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTask),
      });

      const result = await tasksApi.getTaskByUuid("task-123");

      expect(mockFetch).toHaveBeenCalledWith(`${DEFAULT_API_BASE_URL}/tasks/task-123`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token-123",
        },
      });

      expect(result).toEqual(mockTask);
    });

    it("should handle not found error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: "Task not found" }),
      });

      await expect(tasksApi.getTaskByUuid("non-existent")).rejects.toThrow("Task not found");
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
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
        createdBy: { uuid: "user-1", username: "me" },
        assignedTo: { uuid: "user-1", username: "me" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCreatedTask),
      });

      const result = await tasksApi.createTask(taskData);

      expect(mockFetch).toHaveBeenCalledWith(`${DEFAULT_API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token-123",
        },
        body: JSON.stringify(taskData),
      });

      expect(result).toEqual(mockCreatedTask);
    });

    it("should handle validation errors", async () => {
      const invalidTaskData: CreateTaskRequest = {
        title: "",
        description: "",
        priority: TaskPriority.LOW,
        dueDate: "",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Title is required" }),
      });

      await expect(tasksApi.createTask(invalidTaskData)).rejects.toThrow("Title is required");
    });
  });

  describe("updateTask", () => {
    it("should update task successfully", async () => {
      const updateData: UpdateTaskRequest = {
        title: "Updated Title",
        status: TaskStatus.IN_PROGRESS,
      };

      const mockUpdatedTask = {
        uuid: "task-123",
        title: "Updated Title",
        description: "Original description",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: "2025-12-31T12:00:00Z",
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-02T10:00:00Z",
        createdBy: { uuid: "user-1", username: "me" },
        assignedTo: { uuid: "user-1", username: "me" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUpdatedTask),
      });

      const result = await tasksApi.updateTask("task-123", updateData);

      expect(mockFetch).toHaveBeenCalledWith(`${DEFAULT_API_BASE_URL}/tasks/task-123`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token-123",
        },
        body: JSON.stringify(updateData),
      });

      expect(result).toEqual(mockUpdatedTask);
    });

    it("should handle update error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: "Permission denied" }),
      });

      await expect(tasksApi.updateTask("task-123", { status: TaskStatus.COMPLETED }))
        .rejects.toThrow("Permission denied");
    });
  });

  describe("deleteTask", () => {
    it("should delete task successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await tasksApi.deleteTask("task-123");

      expect(mockFetch).toHaveBeenCalledWith(`${DEFAULT_API_BASE_URL}/tasks/task-123`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token-123",
        },
      });
    });

    it("should handle delete error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: "Task not found" }),
      });

      await expect(tasksApi.deleteTask("non-existent")).rejects.toThrow("Task not found");
    });
  });

  describe("token management", () => {
    it("should include authorization header when token is available", async () => {
      tasksApi.setTokenGetter(() => "my-secret-token");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await tasksApi.getAllTasks();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer my-secret-token",
          }),
        })
      );
    });

    it("should not include authorization header when token is null", async () => {
      tasksApi.setTokenGetter(() => null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await tasksApi.getAllTasks();

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders["Authorization"]).toBeUndefined();
    });
  });
});
