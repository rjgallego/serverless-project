import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

import { getToken } from '../auth/auth0Authorizer';
import { parseUserId } from '../../auth/utils';
import { createTodo } from '../../businessLogic/todos';
import { createLogger } from '../../utils/logger';

const logger = createLogger('createTodo');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  const authHeader = event.headers.Authorization;
  const jwtToken = getToken(authHeader);
  logger.info('Getting jwtToken: ', {jwtToken: jwtToken});

  const userId = parseUserId(jwtToken);
  logger.info('Getting userId: ', {userId: userId})

  const newItem = await createTodo(userId, newTodo);
  logger.info('New item created: ', {newItem: newItem})

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
