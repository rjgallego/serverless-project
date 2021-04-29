import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { TodoAccess } from '../dataLayer/todoAccess'
import * as uuid from 'uuid';
import { CreateTodoRequest } from '../requests/CreateTodoRequest';


const todoAccess = new TodoAccess()

export async function getUserTodos(userId: string): Promise<TodoItem[]> {
  return todoAccess.getUserTodos(userId);
}

export async function createTodo(userId: string, newTodo: CreateTodoRequest): Promise<TodoItem>{
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()

  const params = {
    userId: userId,
    todoId: todoId,
    createdAt: createdAt,
    name: newTodo.name,
    dueDate: newTodo.dueDate,
    done: false
  } as TodoItem;

  return todoAccess.createTodo(params);
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<TodoItem>{
    return todoAccess.updateTodo(userId, todoId, updatedTodo)
}

export async function deleteTodo(userId: string, todoId: string){
  return todoAccess.deleteTodo(userId, todoId);
}

export async function updateUploadURL(userId: string, todoId: string): Promise<string> {
  const url = await todoAccess.getUploadURL(todoId);

  await todoAccess.updateUploadURL(userId, todoId);

  return url;
}