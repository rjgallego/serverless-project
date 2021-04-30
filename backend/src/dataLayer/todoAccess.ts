import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import {TodoItem} from '../models/TodoItem';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { createLogger } from '../utils/logger';

const AWSXRay = require('aws-xray-sdk')

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

const logger = createLogger('todoAccess');

const XAWS = AWSXRay.captureAWS(AWS);

export class TodoAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly indexName = process.env.INDEX_NAME,
        private readonly bucketName = process.env.ATTACH_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    ){}

      async getUserTodos(userId: string): Promise<TodoItem[]> {
        logger.info('Getting all users todos');

        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId
            },
            ScanIndexForward: false
          }).promise()

          const todos = result.Items;
          logger.info('Todos retrieved: ', {todos: todos} )

          return todos as TodoItem[]
      }

      async createTodo(newItem: TodoItem): Promise<TodoItem> {
        logger.info("Creating todo item: ", {newItem: newItem});
        await this.docClient.put({
          TableName: this.todosTable,
          Item: newItem
        }).promise()

        return newItem;
      }

      async updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<TodoItem>{
        logger.info("Updating todo Item: " + {todoId: todoId})
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.indexName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId
            }
          }).promise()
        
          if(result.Count !== 0){
            logger.info('User id validated');

            const result = await this.docClient.update({
              TableName: this.todosTable,
              Key: {
                userId: userId,
                todoId: todoId
              },
              ExpressionAttributeNames:{
                '#todoName': 'name'
              },
              ExpressionAttributeValues:{
                ':name': updatedTodo.name,
                ':dueDate': updatedTodo.dueDate,
                ':done': updatedTodo.done
              },
              UpdateExpression: 'SET #todoName = :name, dueDate = :dueDate, done = :done',
              ReturnValues: 'ALL_NEW'
            }).promise();
        
            const attributes = result.Attributes;
            logger.info('Todo item has been updated: ', {updatedTodo: attributes});

            return attributes as TodoItem;
        }
        logger.info('User could not be validated: ' + {userId: userId});
        return null;
      }

    async deleteTodo(userId: string, todoId: string) {
      logger.info('Deleting todo item: ' + {todoId: todoId})

      try{
        await this.docClient.delete({
          TableName: this.todosTable,
          Key: {
            userId: userId,
            todoId: todoId
          }
        }).promise()
      }catch(e){
        logger.info('Could not delete item: ', {error: e.message})
      }
    }

    async getUploadURL(imageId: string): Promise<string>{
      logger.info('Getting upload url: ', {imageId: imageId});
      return s3.getSignedUrl('putObject', {
        Bucket: this.bucketName,
        Key: imageId,
        Expires: this.urlExpiration
      })
    }

    async updateUploadURL(userId: string, todoId: string): Promise<TodoItem>{
      const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
      logger.info('Attachment URL created: ', {url: attachmentUrl});

      logger.info('Updating todo attachment URL')
      const result = await this.docClient.update({
        TableName: this.todosTable,
        Key: {
          userId: userId,
          todoId: todoId
        },
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        },
        UpdateExpression: 'SET attachmentUrl = :attachmentUrl',
        ReturnValues: 'UPDATED_NEW'
      }).promise()

      logger.info('URL attached: ', {result: result.Attributes});

      return result.Attributes as TodoItem;
    }
}