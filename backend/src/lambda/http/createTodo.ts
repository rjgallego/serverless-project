import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

import { getToken } from '../auth/auth0Authorizer';
import { parseUserId } from '../../auth/utils';
import { createTodo } from '../../businessLogic/todos';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  const authHeader = event.headers.Authorization;
  const jwtToken = getToken(authHeader);
  const userId = parseUserId(jwtToken);

  // TODO: Implement creating a new TODO item
  const newItem = await createTodo(userId, newTodo);

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newItem
    })
  }
}
