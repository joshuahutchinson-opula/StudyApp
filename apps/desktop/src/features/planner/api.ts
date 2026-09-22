import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Deadline, Discipline, Task, TaskStatus } from "@the-desk/shared";
import { api } from "../../api/client";

export function useTasks(userId: string, discipline: Discipline) {
  return useQuery({
    queryKey: ["tasks", userId, discipline],
    queryFn: () => api.get<Task[]>(`/tasks?userId=${userId}&discipline=${discipline}`),
  });
}

export function useDeadlines(userId: string) {
  return useQuery({
    queryKey: ["deadlines", userId],
    queryFn: () => api.get<Deadline[]>(`/deadlines?userId=${userId}`),
  });
}

export function useCreateTask(userId: string, discipline: Discipline) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, parentTaskId }: { title: string; parentTaskId?: string }) =>
      api.post<Task>("/tasks", { userId, discipline, title, parentTaskId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", userId, discipline] });
    },
  });
}

export function useUpdateTaskStatus(userId: string, discipline: Discipline) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      api.patch<Task>(`/tasks/${taskId}`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", userId, discipline] });
    },
  });
}

export function useCreateDeadline(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, dueAt }: { title: string; dueAt: string }) =>
      api.post<Deadline>("/deadlines", { userId, title, dueAt }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deadlines", userId] });
    },
  });
}
