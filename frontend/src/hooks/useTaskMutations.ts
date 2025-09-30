import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, CreateTaskRequest, UpdateTaskRequest, TaskStatus, type Task } from '@/services/tasks-api';

export const useUserTasks = (status?: TaskStatus) => {
  return useQuery({
    queryKey: ['tasks', 'user', status],
    queryFn: () => tasksApi.getUserTasks(status),
  });
};

export const useTask = (uuid: string) => {
  return useQuery({
    queryKey: ['tasks', uuid],
    queryFn: () => tasksApi.getTaskByUuid(uuid),
    enabled: !!uuid,
  });
};

export const useTaskMutations = () => {
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: (taskData: CreateTaskRequest) => tasksApi.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  type UpdateTaskVariables = { uuid: string; taskData: UpdateTaskRequest };
  type UpdateTaskContext = { previousTasks?: Task[] };

  const updateTask = useMutation<Task, unknown, UpdateTaskVariables, UpdateTaskContext>({
    mutationFn: ({ uuid, taskData }) => tasksApi.updateTask(uuid, taskData),
    onMutate: async ({ uuid, taskData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', 'user', undefined]);

      // Optimistically update
      queryClient.setQueryData<Task[] | undefined>(['tasks', 'user', undefined], (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.uuid === uuid ? { ...task, ...taskData } : task
        );
      });

      return previousTasks ? { previousTasks } : {};
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', 'user', undefined], context.previousTasks);
      }
    },
    onSuccess: () => {
      // Silently refetch in background to sync with server
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (uuid: string) => tasksApi.deleteTask(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    createTask,
    updateTask,
    deleteTask,
  };
};
