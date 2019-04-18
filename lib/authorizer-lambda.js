const AWS = require('aws-sdk')

const TableName = process.env.TABLE_NAME
const primaryKeyColumn = process.env.PRIMARY_KEY_COLUMN_NAME
const region = process.env.REGION

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

const buildPolicy = (event, allow) => {
  return {
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Effect: allow ? 'Allow' : 'Deny',
        Action: 'execute-api:Invoke',
        Resource: event.methodArn
      }]
    }
  }
}

const doGet = (config, event) => {
  const params = {
    TableName: config.TableName,
    Key: { [config.primaryKeyColumn]: event.authorizationToken }
  }
  return config.docClient.get(params).promise()
}

const getLambda = async (event) => {
  const config = initialize()
  if (isConfigInvalid(config)) {
    console.error('lambda is not properly configured')
    return buildPolicy(event)
  }

  return doGet(config, event).then(data => {
    if (data.Item && data.Item.userId === event.authorizationToken) {
      return buildPolicy(event, true)
    }
    return buildPolicy(event)
  })
}

module.exports = getLambda
