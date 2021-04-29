import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import {getToken} from '../auth/auth0Authorizer'
import { parseUserId } from '../../auth/utils';

import { getUserTodos } from '../../businessLogic/todos';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const authHeader = event.headers.Authorization;
  const jwtToken = getToken(authHeader)
  const userId = parseUserId(jwtToken)

  const todos = await getUserTodos(userId)

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