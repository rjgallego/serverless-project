import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { TodoAccess } from '../dataLayer/todoAccess'
import * as uuid from 'uuid';
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { createLogger } from '../utils/logger';


const todoAccess = new TodoAccess()

const logger = createLogger('todos')

export async function getUserTodos(userId: string): Promise<TodoItem[]> {
  logger.info('Calling getUserTodos from data layer: ', {userId: userId})
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

  logger.info('Calling createTodos from data layer with new todo item: ', {newTodo: params})

  return todoAccess.createTodo(params);
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<TodoItem>{
  logger.info('Calling updateTodo from data layer with updated todo item: ', {updatedTodo: updatedTodo})
  return todoAccess.updateTodo(userId, todoId, updatedTodo)
}

export async function deleteTodo(userId: string, todoId: string){
  logger.info('Calling deleteTodo from data layer with todoId: ', {todoId: todoId});
  return todoAccess.deleteTodo(userId, todoId);
}

export async function updateUploadURL(userId: string, todoId: string): Promise<string> {
  logger.info('Getting upload URL from data layer')
  const url = await todoAccess.getUploadURL(todoId);

  logger.info('Upload URL generated: ', {url: url});

  logger.info('Uploading image to S3')
  await todoAccess.updateUploadURL(userId, todoId);
  logger.info('Image uploaded to S3');

  return url;
}