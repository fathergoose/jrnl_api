'use strict';
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const TABLENAME = 'jrnl_entries';

function _extractBody(event) {
  const body = JSON.parse(event.body);
  if (event.httpMethod === 'POST') {
    return {
      TableName: TABLENAME,
      Item: body
    };
  }
  return {
    TableName: TABLENAME,
    Key: { ID: body.ID }
  };

}


function handler(event, context, callback) {
  const now = new Date();
  const body = event.httpMethod === 'GET' ? '' : _extractBody(event);

  const done = (err, res) => {
    return callback(null, {
      statusCode: err ? '400' : '200',
      body: err ? err.message : JSON.stringify(res),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  };

  switch (event.httpMethod) {
    case 'DELETE': {
      dynamo.deleteItem(body, done);
      break;
    }
    case 'GET': {
      if (event.queryStringParameters && event.queryStringParameters.ID) {
        dynamo.getItem({
          TableName: TABLENAME,
          Key: { ID: event.queryStringParameters.ID }
        }, done);
      } else {
        dynamo.scan({ TableName: TABLENAME }, done);
      }
      break;
    }
    case 'POST': {
      if (!body.Item.ID) {
        body.Item.ID = body.Item.Title + 'AT:' + now.toISOString();
        body.Item.CreatedAt = now.toISOString();
      }
      body.Item.UpdatedAt = now.toISOString();
      dynamo.putItem(body, done);
      break;
    }
    default: {
      done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
  }
}


module.exports = { handler };
