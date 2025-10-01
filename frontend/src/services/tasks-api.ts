import { getApiBaseUrl } from "@/config/env";
import { parseJsonSafely } from "@/lib/http";

export interface Task {
  uuid: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    uuid: string;
    username: string;
  };
  assignedTo?: {
    uuid: string;
    username: string;
  };
}

export interface PaginationMetadata {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginatedTasksResponse {
  content: Task[];
  page: PaginationMetadata;
}

export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedToUuid?: string;
}

const API_BASE_URL = getApiBaseUrl();

class TasksApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "TasksApiError";
  }
}

// Token management
let tokenGetter: (() => string | null) | null = null;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new TasksApiError(
      errorData.message || "Request failed",
      response.status,
    );
  }
  return parseJsonSafely<unknown>(response);
};

const getAuthHeaders = () => {
  const token = tokenGetter?.();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

interface GetUserTasksOptions {
  status?: TaskStatus;
  page?: number;
  size?: number;
}

const ensurePaginationMetadata = (
  partial: Partial<PaginationMetadata> | undefined,
  fallback: PaginationMetadata,
): PaginationMetadata => {
  const size = Number.isFinite(partial?.size)
    ? Number(partial?.size)
    : fallback.size;
  const number = Number.isFinite(partial?.number)
    ? Number(partial?.number)
    : fallback.number;
  const totalElements = Number.isFinite(partial?.totalElements)
    ? Number(partial?.totalElements)
    : fallback.totalElements;
  const totalPages = Number.isFinite(partial?.totalPages)
    ? Number(partial?.totalPages)
    : fallback.totalPages;

  return {
    size,
    number,
    totalElements,
    totalPages: Math.max(
      1,
      totalPages || Math.ceil(totalElements / Math.max(1, size)),
    ),
  };
};

const normalizePaginatedTasks = (
  data: unknown,
  fallback: PaginationMetadata,
): PaginatedTasksResponse => {
  if (!data) {
    return { content: [], page: fallback };
  }

  if (Array.isArray(data)) {
    const content = data as Task[];
    const inferredTotal = fallback.number * fallback.size + content.length;
    return {
      content,
      page: {
        ...fallback,
        size: fallback.size,
        totalElements: inferredTotal,
        totalPages: Math.max(
          1,
          Math.ceil(inferredTotal / Math.max(1, fallback.size)),
        ),
      },
    };
  }

  if (typeof data === "object" && data !== null) {
    const maybeContent = (data as { content?: unknown }).content;
    const content = Array.isArray(maybeContent) ? (maybeContent as Task[]) : [];
    const maybePage = (data as { page?: Partial<PaginationMetadata> }).page;

    const fallbackWithContent = {
      ...fallback,
      totalElements: Number.isFinite(maybePage?.totalElements)
        ? Number(maybePage?.totalElements)
        : fallback.totalElements || content.length,
      totalPages: Number.isFinite(maybePage?.totalPages)
        ? Number(maybePage?.totalPages)
        : fallback.totalPages,
    } satisfies PaginationMetadata;

    return {
      content,
      page: ensurePaginationMetadata(maybePage, fallbackWithContent),
    };
  }

  return { content: [], page: fallback };
};

export const tasksApi = {
  setTokenGetter(getter: () => string | null): void {
    tokenGetter = getter;
  },

  async getAllTasks(): Promise<Task[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await handleResponse(response);
      return Array.isArray(data) ? (data as Task[]) : [];
    } catch (error) {
      if (error instanceof TypeError) {
        throw new TasksApiError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
      throw error;
    }
  },

  async getUserTasks({
    status,
    page = 0,
    size = 20,
  }: GetUserTasksOptions = {}): Promise<PaginatedTasksResponse> {
    try {
      const url = new URL(`${API_BASE_URL}/tasks/me`);
      if (status) {
        url.searchParams.append("status", status);
      }
      url.searchParams.append("page", page.toString());
      url.searchParams.append("size", size.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await handleResponse(response);
      const fallbackPagination: PaginationMetadata = {
        size,
        number: page,
        totalElements: 0,
        totalPages: 1,
      };

      return normalizePaginatedTasks(data, fallbackPagination);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new TasksApiError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
      throw error;
    }
  },

  async getTaskByUuid(uuid: string): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${uuid}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await handleResponse(response);
      if (!data) {
        throw new TasksApiError("Task not found", response.status);
      }

      return data as Task;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new TasksApiError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
      throw error;
    }
  },

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData),
      });

      const data = await handleResponse(response);
      if (!data) {
        throw new TasksApiError("Empty create task response", response.status);
      }

      return data as Task;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new TasksApiError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
      throw error;
    }
  },

  async updateTask(uuid: string, taskData: UpdateTaskRequest): Promise<Task> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${uuid}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData),
      });

      const data = await handleResponse(response);
      if (!data) {
        throw new TasksApiError("Empty update task response", response.status);
      }

      return data as Task;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new TasksApiError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
      throw error;
    }
  },

  async deleteTask(uuid: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${uuid}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new TasksApiError(
          errorData.message || "Request failed",
          response.status,
        );
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new TasksApiError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
      throw error;
    }
  },
};
