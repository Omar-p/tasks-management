import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import {
  tasksApi,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  type Task,
  type PaginatedTasksResponse,
} from "@/services/tasks-api";

export const DEFAULT_TASKS_PAGE_SIZE = 20;

export const useUserTasks = (
  status?: TaskStatus,
  pageSize = DEFAULT_TASKS_PAGE_SIZE,
) => {
  return useInfiniteQuery<
    PaginatedTasksResponse,
    unknown,
    PaginatedTasksResponse,
    ["tasks", "user", { status: TaskStatus | null; pageSize: number }],
    number
  >({
    queryKey: ["tasks", "user", { status: status ?? null, pageSize }],
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page.number + 1;
      return nextPage < lastPage.page.totalPages ? nextPage : undefined;
    },
    queryFn: ({ pageParam = 0 }) =>
      tasksApi.getUserTasks({
        ...(status ? { status } : {}),
        page: pageParam,
        size: pageSize,
      }),
  });
};

export const useTask = (uuid: string) => {
  return useQuery({
    queryKey: ["tasks", uuid],
    queryFn: () => tasksApi.getTaskByUuid(uuid),
    enabled: !!uuid,
  });
};

type TasksInfiniteData = InfiniteData<PaginatedTasksResponse>;

type TasksQueriesSnapshot = Array<[QueryKey, TasksInfiniteData | undefined]>;

const clonePaginatedData = (
  data: TasksInfiniteData,
  mutateFn: (page: PaginatedTasksResponse) => PaginatedTasksResponse,
): TasksInfiniteData => ({
  ...data,
  pages: data.pages.map((page) => mutateFn(page)),
});

const updateAllTaskQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (page: PaginatedTasksResponse) => PaginatedTasksResponse,
) => {
  const queries = queryClient.getQueriesData<TasksInfiniteData>({
    queryKey: ["tasks", "user"],
  });

  queries.forEach(([queryKey, data]) => {
    if (!data) return;
    const next = clonePaginatedData(data, updater);
    queryClient.setQueryData(queryKey, next);
  });

  return queries;
};

const restoreTaskQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot?: TasksQueriesSnapshot,
) => {
  snapshot?.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
};

export const useTaskMutations = () => {
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: (taskData: CreateTaskRequest) => tasksApi.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  type UpdateTaskVariables = { uuid: string; taskData: UpdateTaskRequest };
  type UpdateTaskContext = { previousQueries?: TasksQueriesSnapshot };

  const updateTask = useMutation<
    Task,
    unknown,
    UpdateTaskVariables,
    UpdateTaskContext
  >({
    mutationFn: ({ uuid, taskData }) => tasksApi.updateTask(uuid, taskData),
    onMutate: async ({ uuid, taskData }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousQueries = updateAllTaskQueries(queryClient, (page) => ({
        ...page,
        content: page.content.map((task) =>
          task.uuid === uuid ? { ...task, ...taskData } : task,
        ),
      }));

      return previousQueries.length ? { previousQueries } : {};
    },
    onError: (_err, _variables, context) => {
      restoreTaskQueries(queryClient, context?.previousQueries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  type DeleteTaskContext = { previousQueries?: TasksQueriesSnapshot };

  const deleteTask = useMutation<void, unknown, string, DeleteTaskContext>({
    mutationFn: (uuid: string) => tasksApi.deleteTask(uuid),
    onMutate: async (uuid: string) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousQueries = updateAllTaskQueries(queryClient, (page) => {
        const filtered = page.content.filter((task) => task.uuid !== uuid);
        if (filtered.length === page.content.length) {
          return page;
        }

        const totalElements = Math.max(0, page.page.totalElements - 1);
        const size = Math.max(1, page.page.size);

        return {
          ...page,
          content: filtered,
          page: {
            ...page.page,
            totalElements,
            totalPages: Math.max(1, Math.ceil(totalElements / size)),
          },
        };
      });

      return previousQueries.length ? { previousQueries } : {};
    },
    onError: (_err, _uuid, context) => {
      restoreTaskQueries(queryClient, context?.previousQueries);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return {
    createTask,
    updateTask,
    deleteTask,
  };
};
