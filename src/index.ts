import { env } from 'process';
import { v4 as uuid } from 'uuid';

exports.handler = async (request: any) => {
  const directiveNamespace = request.directive.header.namespace;
  const directiveName = request.directive.header.name;

  let response: any;
  console.log('[request]', directiveNamespace, directiveName);

  try {
    if (directiveNamespace === 'Alexa.Discovery' && directiveName === 'Discover') {
      // 機器登録
      response = await handleDiscover(request);
    } else if (directiveNamespace === 'Alexa.Authorization' && directiveName === 'AcceptGrant') {
      // 認証
      response = await handleAcceptGrant(request);
    } else {
      throw new Error(`namespace: ${directiveNamespace}, name: ${directiveName}`);
    }
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    response = handleError(request, error);
  }

  console.log('[response]', response.event.header.namespace, response.event.header.name);
  return response;
};

/**
 * エラー処理
 *
 * @param request
 * @param error
 * @returns
 */
function handleError(request: any, error: Error) {
  const endpointId = request.directive.endpoint.endpointId as string;

  const payload = { type: 'INTERNAL_ERROR', message: error.message };

  console.log('[error]', error.message);

  return {
    'event': {
      'header': {
        'namespace': 'Alexa',
        'name': 'ErrorResponse',
        'messageId': uuid(),
        'payloadVersion': '3'
      },
      'endpoint': {
        'endpointId': endpointId
      },
      'payload': payload
    }
  };
}

/**
 * 機器登録
 *
 * @param request
 * @returns
 */
async function handleDiscover(request: any): Promise<object> {
  const endpoints = [];

  const nod = Number(env.NUMBER_OF_DEVICES);
  for (let number = 1; number <= nod; number++) {
    endpoints.push({
      'endpointId': `${env.AWS_LAMBDA_FUNCTION_NAME}-${number}`,
      'manufacturerName': 'HTTP Sensor',
      'friendlyName': `HTTP Sensor ${number}`,
      'description': 'HTTP Sensor',
      'displayCategories': ['CONTACT_SENSOR'],
      'cookie': {},
      'capabilities': [
        // コンタクトセンサー
        {
          'type': 'AlexaInterface',
          'interface': 'Alexa.ContactSensor',
          'version': '3',
          'properties': {
            'supported': [
              {
                'name': 'detectionState'
              }
            ],
            'proactivelyReported': true,
            'retrievable': false
          }
        },
        // Alexa
        {
          'type': 'AlexaInterface',
          'interface': 'Alexa',
          'version': '3'
        }
      ]
    });
  }

  return {
    'event': {
      'header': {
        'namespace': 'Alexa.Discovery',
        'name': 'Discover.Response',
        'payloadVersion': '3',
        'messageId': uuid()
      },
      'payload': { 'endpoints': endpoints }
    }
  };
}

/**
 * 認証
 *
 * @param request
 * @returns
 */
async function handleAcceptGrant(request: any) {
  console.log('Grant Code:', request.directive.payload.grant.code);

  return {
    'event': {
      'header': {
        'namespace': 'Alexa.Authorization',
        'name': 'AcceptGrant.Response',
        'payloadVersion': '3',
        'messageId': uuid()
      },
      'payload': {}
    }
  };
}
