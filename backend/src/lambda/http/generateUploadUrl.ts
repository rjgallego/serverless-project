import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getToken } from '../auth/auth0Authorizer';
import { parseUserId } from '../../auth/utils';
import { updateUploadURL } from '../../businessLogic/todos';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const authHeader = event.headers.Authorization;
  const jwtToken = getToken(authHeader);
  const userId = parseUserId(jwtToken);

  const url = await updateUploadURL(userId, todoId);

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
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