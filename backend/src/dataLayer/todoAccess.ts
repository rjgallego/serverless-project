import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import {TodoItem} from '../models/TodoItem';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';

const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

export class TodoAccess {
    constructor(
        private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly indexName = process.env.INDEX_NAME,
        private readonly bucketName = process.env.ATTACH_S3_BUCKET,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    ){}

      async getUserTodos(userId: string): Promise<TodoItem[]> {
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId
            },
            ScanIndexForward: false
          }).promise()

          const todos = result.Items;

          return todos as TodoItem[]
      }

      async createTodo(newItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
          TableName: this.todosTable,
          Item: newItem
        }).promise()

        return newItem;
      }

      async updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<TodoItem>{
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.indexName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': userId
            }
          }).promise()
        
          if(result.Count !== 0){
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
            return attributes as TodoItem;
        }
        return null;
      }

    async deleteTodo(userId: string, todoId: string) {
        await this.docClient.delete({
          TableName: this.todosTable,
          Key: {
            userId: userId,
            todoId: todoId
          }
        }).promise()
    }

    async getUploadURL(imageId: string): Promise<string>{
      return s3.getSignedUrl('putObject', {
        Bucket: this.bucketName,
        Key: imageId,
        Expires: this.urlExpiration
      })
    }

    async updateUploadURL(userId: string, todoId: string): Promise<TodoItem>{
      const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`

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

      return result.Attributes as TodoItem;
    }
}