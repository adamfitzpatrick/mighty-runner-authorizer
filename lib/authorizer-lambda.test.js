const rewire = require('rewire')
const sinon = require('sinon')
const chai = require('chai')
chai.should()
chai.use(require('chai-as-promised'))
chai.use(require('sinon-chai'))

describe('authorizer-lambda', () => {
  let sut
  let docClientMock
  let consoleStubs
  let policy
  let event

  const promiseResolver = (value) => {
    return { promise: () => Promise.resolve(value) }
  }

  const setEnvVars = (sortKey) => {
    sut.__set__('process', {
      env: {
        TABLE_NAME: 'table',
        PRIMARY_KEY_COLUMN_NAME: 'token',
        REGION: 'us-west-2'
      }
    })
  }

  beforeEach(() => {
    sut = rewire('./authorizer-lambda')
    const fakeDocClient = {
      get: () => 'get'
    }
    docClientMock = sinon.mock(fakeDocClient)
    const FakeDocClientConstructor = function () {
      Object.assign(this, fakeDocClient)
    }
    sut.__get__('AWS').DynamoDB = {
      DocumentClient: FakeDocClientConstructor
    }
    consoleStubs = {
      log: sinon.stub(),
      error: sinon.stub()
    }
    sut.__set__('console', consoleStubs)
    response = {
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: 'methodArn'
          }
        ]
      }
    }
    event = {
      methodArn: 'methodArn',
      headers: {
        Authorization: 'Bearer token'
      },
      requestContext: {
        operationName: 'VERB_path'
      }
    }
  })

  describe('when provided with a valid authorization token', () => {
    it('should grant access to the requested method', () => {
      setEnvVars()
      const params = {
        TableName: 'table',
        Key: { token: 'token' }
      }
      docClientMock.expects('get')
        .withExactArgs(params)
        .returns(promiseResolver({ Item: { token: 'token' } }))
      return sut(event)
        .should.eventually.deep.equal(response).then(() => {
          docClientMock.verify()
        })
    })
  })

  describe('when provided with an invalid authorization token', () => {
    it('should deny access to the requested method', () => {
      setEnvVars()
      const params = {
        TableName: 'table',
        Key: { token: 'bad-token' }
      }
      docClientMock.expects('get')
        .withExactArgs(params)
        .returns(promiseResolver({ Item: {} }))
      response.policyDocument.Statement[0].Effect = 'Deny'
      event.headers.Authorization = 'Bearer bad-token'
      return sut(event)
        .should.eventually.deep.equal(response).then(() => {
          docClientMock.verify()
        })
    })
  })

  describe('when the authorizer lambda is improperly configured', () => {
    it('should deny access without checking token', () => {
      response.policyDocument.Statement[0].Effect = 'Deny'
      return sut(event)
        .should.eventually.deep.equal(response)
    })
  })
})