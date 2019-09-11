const AWS = require('aws-sdk')

const TableName = process.env.TABLE_NAME
const primaryKeyColumn = process.env.PRIMARY_KEY_COLUMN_NAME
const region = process.env.REGION
const resourceArnRegex = /(GET|PUT|PATCH|POST|DELETE|OPTIONS)\/.*/

const initialize = () => {
  AWS.config.update({ region: process.env.REGION })
  return {
    docClient: new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' }),
    TableName: process.env.TABLE_NAME,
    primaryKeyColumn: process.env.PRIMARY_KEY_COLUMN_NAME,
    region: process.env.REGION
  }
}

const isConfigInvalid = ({ docClient, TableName, primaryKeyColumn, region }) => {
  if (!docClient || !TableName || !primaryKeyColumn || !region) {
    return true
  }
}

const getAuthorizedResource = (event) => {
  return event.methodArn.replace(resourceArnRegex, '*/*')
}

const buildPolicy = (event, allow) => {
  return {
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Effect: allow ? 'Allow' : 'Deny',
        Action: 'execute-api:Invoke',
        Resource: getAuthorizedResource(event)
      }]
    }
  }
}

const doGet = (token, config) => {
  const params = {
    TableName: config.TableName,
    Key: { [config.primaryKeyColumn]: token }
  }
  return config.docClient.get(params).promise()
}

const authorizerLambda = async (event) => {
  console.log('methodArn: ', event.methodArn)
  const token = event.authorizationToken.replace('Bearer ', '')
  const config = initialize()
  if (isConfigInvalid(config)) {
    console.error('lambda is not properly configured')
    return buildPolicy(event)
  }

  return doGet(token, config).then(data => {
    if (data.Item && data.Item.token === token) {
      return buildPolicy(event, true)
    }
    return buildPolicy(event)
  })
}

module.exports = authorizerLambda
