'use strict';

console.log('Loading function');

const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();

const TABLENAME = 'jrnl_entries';


/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 */
exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    //some update

    console.log("######~~CONSOLE LOG EVENT~~~######");
    console.log(event);    
    console.log("######~~CONSOLE LOG CONTEXT~~~######");
    console.log(context);


    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });

    switch (event.httpMethod) {
        case 'DELETE':
            dynamo.deleteItem(extractBody(event), done);
            break;
        case 'GET':
            if (event.queryStringParameters && event.queryStringParameters.ID) {
                dynamo.getItem({
                    TableName: TABLENAME,
                    Key: {
                        ID: event.queryStringParameters.ID
                    }
                }, done)
            } else {
                dynamo.scan({ TableName: TABLENAME }, done);                
            }
            break;
        case 'POST':
            var now = new Date();
            var body = extractBody(event);

            if (!body.Item.ID) { // If it's a new record
                body.Item.ID = body.Item.Title + 'AT:' + now.toISOString();
                body.Item.CreatedAt = now.toISOString();
            } 

            body.Item.UpdatedAt = now.toISOString();
            
            dynamo.putItem(body, done);
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};

function extractBody(event) {
    var body = JSON.parse(event.body);
    if (event.httpMethod === 'POST') {
        return {
            TableName: TABLENAME,
            Item: body
        }
    } else {
        return {
            TableName: TABLENAME,
            Key: {
                ID: body.ID
            }
        }
    }
}

