import { useCallback, useEffect, useState } from "react";

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

const API_URL = "http://localhost:3000/tasks";

/*
Função genérica pra evitar repetir fetch,
headers e tratamento de erro.
*/

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error("Erro na requisição");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  /*
  Evita repetir tratamento de erro
  em várias funções.
  */

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Ocorreu um erro");
    }
  };

  /*
  Validação reutilizada em createTask
  e updateTask.
  */

  const validateTitle = (title: string) => {
    if (!title.trim()) {
      throw new Error(
        "O título não pode ficar vazio"
      );
    }
  };

  /*
  Busca todas as tarefas.
  */

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await request<Task[]>(
        API_URL
      );

      setTasks(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  Cria nova tarefa.
  */

  const createTask = useCallback(
    async (title: string) => {
      try {
        setSubmitting(true);
        setError("");

        validateTitle(title);

        const newTask = await request<Task>(
          API_URL,
          {
            method: "POST",
            body: JSON.stringify({
              title,
              completed: false,
            }),
          }
        );

        // Atualização otimista

        setTasks((prev: Task[]) => [
          ...prev,
          newTask,
        ]);
      } catch (err) {
        handleError(err);
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  /*
  Atualiza uma tarefa.
  */

  const updateTask = useCallback(
    async (id: number, title: string) => {
      try {
        setSubmitting(true);
        setError("");

        validateTitle(title);

        const updatedTask =
          await request<Task>(
            `${API_URL}/${id}`,
            {
              method: "PUT",
              body: JSON.stringify({
                title,
              }),
            }
          );

        setTasks((prev: Task[]) =>
          prev.map((task: Task) =>
            task.id === id
              ? updatedTask
              : task
          )
        );
      } catch (err) {
        handleError(err);
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  /*
  Alterna o status da tarefa.
  */

  const toggleTask = useCallback(
    async (id: number) => {
      try {
        const currentTask = tasks.find(
          (task: Task) => task.id === id
        );

        if (!currentTask) {
          return;
        }

        const updatedTask =
          await request<Task>(
            `${API_URL}/${id}`,
            {
              method: "PATCH",
              body: JSON.stringify({
                completed:
                  !currentTask.completed,
              }),
            }
          );

        setTasks((prev: Task[]) =>
          prev.map((task: Task) =>
            task.id === id
              ? updatedTask
              : task
          )
        );
      } catch (err) {
        handleError(err);
      }
    },
    [tasks]
  );

  /*
  Remove uma tarefa.
  */

  const deleteTask = useCallback(
    async (id: number) => {
      try {
        await request(
          `${API_URL}/${id}`,
          {
            method: "DELETE",
          }
        );

        setTasks((prev: Task[]) =>
          prev.filter(
            (task: Task) =>
              task.id !== id
          )
        );
      } catch (err) {
        handleError(err);
      }
    },
    []
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    submitting,
    error,
    fetchTasks,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
  };
}