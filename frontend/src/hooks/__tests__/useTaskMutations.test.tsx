import { act, renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  type InfiniteData,
} from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTaskMutations, useUserTasks } from "@/hooks";
import { TestWrapper } from "@/test-utils";
import {
  TaskPriority,
  TaskStatus,
  type PaginatedTasksResponse,
} from "@/services/tasks-api";
import { createEmptyResponse, createJsonResponse } from "@/test/fetch-helpers";
import { AuthProvider } from "@/contexts";
import React from "react";

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

      const data = result.current.data as
        | InfiniteData<PaginatedTasksResponse>
        | undefined;
      expect(data).toBeDefined();
      if (!data) {
        return;
      }

      expect(data.pages[0].content).toEqual(mockTasks.content);
      expect(data.pages[0].page.number).toBe(0);
    });

    it("should fetch the next page when requested", async () => {
      const pageSize = 1;
      // Backend uses zero-based pagination
      const firstPage = {
        content: [
          {
            uuid: "task-1",
            title: "Task 1",
            status: TaskStatus.PENDING,
            priority: TaskPriority.MEDIUM,
            dueDate: "2025-12-31T12:00:00Z",
          },
        ],
        page: {
          number: 0, // zero-based
          size: pageSize,
          totalElements: 2,
          totalPages: 2,
        },
      } satisfies PaginatedTasksResponse;

      const secondPage = {
        content: [
          {
            uuid: "task-2",
            title: "Task 2",
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            dueDate: "2025-12-30T12:00:00Z",
          },
        ],
        page: {
          number: 1, // zero-based
          size: pageSize,
          totalElements: 2,
          totalPages: 2,
        },
      } satisfies PaginatedTasksResponse;

      fetchMock
        .mockResolvedValueOnce(createJsonResponse(firstPage))
        .mockResolvedValueOnce(createJsonResponse(secondPage));

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useUserTasks(undefined, pageSize), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Wait for hasNextPage to be computed before fetching next page
      await waitFor(() => {
        expect(result.current.hasNextPage).toBe(true);
      });

      await act(async () => {
        await result.current.fetchNextPage();
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(result.current.isFetchingNextPage).toBe(false);
      });

      await waitFor(() => {
        const data = result.current.data as
          | InfiniteData<PaginatedTasksResponse>
          | undefined;
        expect(data?.pages?.length).toBe(2);
      });

      const data = result.current.data as
        | InfiniteData<PaginatedTasksResponse>
        | undefined;
      expect(data).toBeDefined();
      if (!data) return;

      expect(data.pages[1].page.number).toBe(1);
      expect(data.pages[1].content[0].uuid).toBe("task-2");
      expect(result.current.hasNextPage).toBe(false);

      queryClient.clear();
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

  describe("optimistic cache updates", () => {
    it("should update task across cached pages on mutate", async () => {
      const queryClient = createQueryClient();
      const wrapper = createWrapper(queryClient);

      const firstTask = {
        uuid: "task-1",
        title: "Task 1",
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dueDate: "2025-12-31T12:00:00Z",
      };
      const secondTask = {
        uuid: "task-2",
        title: "Task 2",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: "2025-12-30T12:00:00Z",
      };

      const initialData: InfiniteData<PaginatedTasksResponse> = {
        pageParams: [0, 1],
        pages: [
          {
            content: [firstTask],
            page: {
              number: 0,
              size: 20,
              totalElements: 2,
              totalPages: 1,
            },
          },
          {
            content: [secondTask],
            page: {
              number: 1,
              size: 20,
              totalElements: 2,
              totalPages: 1,
            },
          },
        ],
      };

      queryClient.setQueryData(
        ["tasks", "user", { status: null, pageSize: 20 }],
        initialData,
      );

      fetchMock.mockResolvedValueOnce(
        createJsonResponse({ ...secondTask, status: TaskStatus.COMPLETED }),
      );

      const { result } = renderHook(() => useTaskMutations(), {
        wrapper,
      });

      act(() => {
        result.current.updateTask.mutate({
          uuid: secondTask.uuid,
          taskData: { status: TaskStatus.COMPLETED },
        });
      });

      await waitFor(() => {
        expect(result.current.updateTask.isSuccess).toBe(true);
      });

      const cached = queryClient.getQueryData([
        "tasks",
        "user",
        { status: null, pageSize: 20 },
      ]) as InfiniteData<PaginatedTasksResponse> | undefined;

      expect(cached?.pages[1].content[0].status).toBe(TaskStatus.COMPLETED);

      queryClient.clear();
    });

    it("should remove deleted task from cached pages", async () => {
      const queryClient = createQueryClient();
      const wrapper = createWrapper(queryClient);

      const firstTask = {
        uuid: "task-1",
        title: "Task 1",
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dueDate: "2025-12-31T12:00:00Z",
      };
      const secondTask = {
        uuid: "task-2",
        title: "Task 2",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: "2025-12-30T12:00:00Z",
      };

      const initialData: InfiniteData<PaginatedTasksResponse> = {
        pageParams: [0, 1],
        pages: [
          {
            content: [firstTask],
            page: {
              number: 0,
              size: 20,
              totalElements: 2,
              totalPages: 1,
            },
          },
          {
            content: [secondTask],
            page: {
              number: 1,
              size: 20,
              totalElements: 2,
              totalPages: 1,
            },
          },
        ],
      };

      queryClient.setQueryData(
        ["tasks", "user", { status: null, pageSize: 20 }],
        initialData,
      );

      fetchMock.mockResolvedValueOnce(createEmptyResponse({ status: 204 }));

      const { result } = renderHook(() => useTaskMutations(), {
        wrapper,
      });

      act(() => {
        result.current.deleteTask.mutate(secondTask.uuid);
      });

      await waitFor(() => {
        expect(result.current.deleteTask.isSuccess).toBe(true);
      });

      const cached = queryClient.getQueryData([
        "tasks",
        "user",
        { status: null, pageSize: 20 },
      ]) as InfiniteData<PaginatedTasksResponse> | undefined;

      expect(cached?.pages[0].content).toHaveLength(1);
      expect(cached?.pages[1].content).toHaveLength(0);
      expect(cached?.pages[0].page.totalElements).toBe(2);
      expect(cached?.pages[1].page.totalElements).toBe(1);

      queryClient.clear();
    });
  });
});
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper =
  (client: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
