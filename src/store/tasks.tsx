import { createContext, useContext, useReducer, type ReactNode } from 'react';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskCategory = 'cleaning' | 'kitchen' | 'outdoor' | 'laundry' | 'shopping' | 'other';

export interface Task {
  id: string;
  title: string;
  points: number;
  status: TaskStatus;
  assignee: string;
  category: TaskCategory;
  isCustom: boolean;
  createdAt: string;
  completedAt?: string;
}

export const PREDEFINED_CHORES: Array<{ title: string; points: number; category: TaskCategory }> = [
  { title: 'Vacuum living room', points: 15, category: 'cleaning' },
  { title: 'Mop floors', points: 20, category: 'cleaning' },
  { title: 'Clean bathroom', points: 25, category: 'cleaning' },
  { title: 'Wipe surfaces', points: 10, category: 'cleaning' },
  { title: 'Clean windows', points: 25, category: 'cleaning' },
  { title: 'Take out trash', points: 10, category: 'cleaning' },
  { title: 'Do dishes', points: 10, category: 'kitchen' },
  { title: 'Clean kitchen', points: 20, category: 'kitchen' },
  { title: 'Wipe counters', points: 8, category: 'kitchen' },
  { title: 'Clean refrigerator', points: 20, category: 'kitchen' },
  { title: 'Empty dishwasher', points: 5, category: 'kitchen' },
  { title: 'Do laundry', points: 15, category: 'laundry' },
  { title: 'Fold & put away laundry', points: 10, category: 'laundry' },
  { title: 'Buy groceries', points: 20, category: 'shopping' },
  { title: 'Restock pantry', points: 10, category: 'shopping' },
  { title: 'Mow lawn', points: 30, category: 'outdoor' },
  { title: 'Sweep patio', points: 15, category: 'outdoor' },
  { title: 'Water plants', points: 5, category: 'outdoor' },
];

type Action =
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_STATUS'; id: string; status: TaskStatus }
  | { type: 'DELETE_TASK'; id: string };

const TasksContext = createContext<{
  tasks: Task[];
  dispatch: React.Dispatch<Action>;
} | null>(null);

function reducer(tasks: Task[], action: Action): Task[] {
  switch (action.type) {
    case 'ADD_TASK':
      return [action.task, ...tasks];
    case 'UPDATE_STATUS':
      return tasks.map(t =>
        t.id === action.id
          ? {
              ...t,
              status: action.status,
              completedAt: action.status === 'completed' ? new Date().toISOString() : undefined,
            }
          : t
      );
    case 'DELETE_TASK':
      return tasks.filter(t => t.id !== action.id);
  }
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, dispatch] = useReducer(reducer, []);
  return <TasksContext.Provider value={{ tasks, dispatch }}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within TasksProvider');
  return ctx;
}
