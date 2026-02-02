
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum OrderStatus {
  PENDING = 'pending',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  dueDate: string;
  createdAt: string;
  subtasks: SubTask[];
  isFavorite: boolean;
  isWishlist: boolean;
  isOrder: boolean;
  orderStatus?: OrderStatus;
}

export interface ProductivityInsight {
  summary: string;
  suggestions: string[];
  encouragement: string;
}
