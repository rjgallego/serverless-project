import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import {getToken} from '../auth/auth0Authorizer'
import { parseUserId } from '../../auth/utils';

import { getUserTodos } from '../../businessLogic/todos';
import { createLogger } from '../../utils/logger';

const logger = createLogger('getTodo');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const authHeader = event.headers.Authorization;
  const jwtToken = getToken(authHeader)
  logger.info('Getting jwtToken: ', {jwtToken: jwtToken});

  const userId = parseUserId(jwtToken)
  logger.info('Getting userId: ', {userId: userId})

  const todos = await getUserTodos(userId)
  logger.info('Todos returned from database ', {todos: todos})

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items: todos
    })
  }

}