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

  async getUserTasks(status?: TaskStatus): Promise<Task[]> {
    try {
      const url = new URL(`${API_BASE_URL}/tasks/me`);
      if (status) {
        url.searchParams.append("status", status);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await handleResponse(response);
      if (!data) {
        return [];
      }

      if (Array.isArray(data)) {
        return data as Task[];
      }

      if (data && typeof data === "object" && "content" in data) {
        return (data as { content?: Task[] }).content ?? [];
      }

      return [];
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
