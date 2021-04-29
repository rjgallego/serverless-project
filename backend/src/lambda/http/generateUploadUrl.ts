import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getToken } from '../auth/auth0Authorizer';
import { parseUserId } from '../../auth/utils';
import { updateUploadURL } from '../../businessLogic/todos';
import { createLogger } from '../../utils/logger';

const logger = createLogger('generateUploadURL');

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const authHeader = event.headers.Authorization;
  const jwtToken = getToken(authHeader);
  logger.info('Getting jwtToken: ', {jwtToken: jwtToken});

  const userId = parseUserId(jwtToken);
  logger.info('Getting userId: ', {userId: userId});

  const url = await updateUploadURL(userId, todoId);
  logger.info('URL generated: ', {url: url});

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      uploadURL: url
    })
  }
}