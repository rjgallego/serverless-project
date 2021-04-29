import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

import { getUserId } from '../utils';

import { updateTodo } from '../../businessLogic/todos';
import { createLogger } from '../../utils/logger';

const logger = createLogger('updateTodo');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)
  logger.info('userId: ', {userId: userId})

  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  logger.info('Update Todo parsed from event body: ', {updatedTodo: updatedTodo})


  const result = await updateTodo(userId, todoId, updatedTodo);
  logger.info('Todo updated: ', {result: result})

  if(result){
    return {
      statusCode: 204,
      body: JSON.stringify({
        result
      })
    };
  }
  
  logger.info('User not found');
  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: ''
  }
}
