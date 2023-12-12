
import { writeFileSync } from "fs";
import { OpenAPIV3_1 } from "openapi-types";
import { AnyStatus } from ".";


type OperationRecord = {
    operation: OpenAPIV3_1.OperationObject;
    verb: OpenAPIV3_1.HttpMethods;
    pathName: string;
    path: OpenAPIV3_1.PathItemObject;
}

function getResponseName(code: AnyStatus) {
    return STATUS_CODE_MAP[code] ?? `Status${code}`;

}

const STATUS_CODE_MAP: Record<AnyStatus,string> = {
    "2XX": "Success",
    200: "OK",
    202: "Accepted",
    201: "Created",
    203: "NonAuthoratitive",
    204: "NoContent",
    // 205: "ResetContent",
    206: "PartialContent",
    207: "MultiStatus",
    // 208: "AlreadyReported",
    // 226: "IMUsed",
    300: "MultipleChoices",
    301: "MovedPermanently",
    302: "Found",
    303: "SeeOther",
    304: "NotModified",
    307: "TemporaryRedirect",
    308: "PermanentRedirect",
    "4XX": "ClientError",
    400: "BadRequest",
    401: "Unauthorized",
    402: "PaymentRequired",
    403: "Forbidden",
    404: "NotFound",
    405: "MethodNotAllowed",
    406: "NotAcceptable",
    407: "ProxyAuthenticationRequired",
    408: "Timeout",
    409: "Conflict",
    410: "Gone",
    411: "LengthRequired",
    412: "PreconditionFailed",
    413: "PayloadTooLarge",
    414: "URITooLong",
    415: "UnsupportedMediaType",
    416: "RangeNotSatisfiable",
    417: "ExpectationFailed",
    418: "Teapot",
    420: 'EnhanceYourCalm', // Really?
    421: "MisdirectedRequest",
    422: "UnprocessableContent",
    423: "Locked",
    424: "FailedDependency",
    425: "TooEarly",
    426: "UpgradeRequired",
    // 428: "PreconditionRequired",
    429: "TooManyRequests",
    431: "RequestHeaderFieldsTooLarge",
    444: "NoResponse",
    450: "BlockedByParentalControls",
    451: "UnavailableForLegalReasons",
    497: "HttpRequestSentToHttpsPort",
    498: "InvalidToken",
    499: "ClientClosed",
    "5XX": "ServerError",
    500: "InternalServerError",
    501: "NotImplemented",
    502: "BadGateway",
    503: "ServiceUnavailable",
    504: "GatewayTimeout",
    505: "HttpVersionNotSupported",
    506: "VariantAlsoNegotiates",
    507: "InsufficientStorage",
    508: "LoopDetected",
    510: "NotExtended",
    511: "NetworkAuthenticationRequired",
    "default": "DefaultOutput",
};


function getResponseCodes(op: OpenAPIV3_1.OperationObject): AnyStatus[] {
    if (!op.responses) {
        return [];
    }
    return Object.keys(op.responses).map(rc => {
        if (rc.match(/^\d+$/)) {
            return parseInt(rc) as AnyStatus;
        } else if (['default', "2XX", "5XX", "4XX"].includes(rc)) {
            return rc as AnyStatus;
        } else {
            return undefined;
        }
    }).filter(x => x !== undefined) as AnyStatus[];
}

function generateResponseType(response: OpenAPIV3_1.ResponseObject, code: AnyStatus, nonDefaultReturns: AnyStatus[]) {
    // const nonDefaultReturns = Object.keys(operation.operation.responses!).filter(c => c.match(/^\d+$/));
    const outputTypeName = getResponseName(code);
    const codeVal = typeof(code) === 'number' ? `${code}`: `"${code}"`;
    const contentType = response.content ? Object.keys(response.content)[0] : undefined;

    if (contentType) {
        return  `
    export type ${outputTypeName} = {
        statusCode: ${code == 'default' ? `Omit<AnyStatus, ${nonDefaultReturns.join(' | ')}>` : code};
        contentType: "${contentType}",
        content: Responses[${codeVal}]["content"]["${contentType}"]
        headers?: Responses[${codeVal}]["headers"]
    } 
    `
    } else {
        return  `
    export type ${outputTypeName} = {
        statusCode: ${code == 'default' ? `Omit<AnyStatus, ${nonDefaultReturns.join(' | ')}>` : code};
        contentType?: never,
        content?: never
        headers?: Responses[${codeVal}]["headers"]
    } 
    `
    
    }
}

function getResponse(op: OpenAPIV3_1.OperationObject, code: AnyStatus) {
    return (op.responses as any)[code.toString()] as OpenAPIV3_1.ResponseObject;
}


function deref<X extends {}>(x: X|OpenAPIV3_1.ReferenceObject, spec: OpenAPIV3_1.Document): X {
    if ('$ref' in x) {
        const sv = x.$ref.split('/');
        if (!spec.components) {
            throw new Error("Specification has no components");
        }
        if (sv.length != 4) {
            throw new Error("Reference must have exactly 4 items")
        }
        if (sv[0] != '#') {
            throw new Error("We only support local refs right now");
        }
        if (sv[1] != 'components') {
            throw new Error("We only support component refs right now.");
        }
        const type = sv[2];
        const ref = sv[3];
        switch (type) {
            case 'callbacks':
                return deref((spec.components.callbacks ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'examples':
                return deref((spec.components.examples ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'headers':
                return deref((spec.components.headers ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'links':
                return deref((spec.components.links ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'parameters':
                return deref((spec.components.parameters ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'pathItems':
                return deref((spec.components.pathItems ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'requestBodies':
                return deref((spec.components.requestBodies ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'responses':
                return deref((spec.components.responses ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'schemas':
                return deref((spec.components.schemas ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            case 'securitySchemas':
                return deref((spec.components.securitySchemes ?? {})[ref] as X|OpenAPIV3_1.ReferenceObject, spec);
            default:
                throw new Error("Invalid reference type " + type);
        }
    }
    return x;
}



/**
 * Generates a more pretty Typescript type to specify a handler for a service than is generated by the default generator.
 * @param spec 
 * @param outFile 
 */
export function generateHandler(spec: OpenAPIV3_1.Document, outFile: string) {
    const operations: Record<string, OperationRecord> = {};
    const serviceName = spec.info.title.replace(/\s+([a-zA-Z])/g, (match, p1) => (p1 as string).toUpperCase())

    for (let [path, pathObject] of Object.entries(spec.paths ?? [])) {
        for (let [method, operation] of Object.entries(pathObject ?? [])) {
            if (typeof(operation) === 'object' && 'operationId' in operation) {
                operations[operation.operationId!] = {
                    operation,
                    pathName: path,
                    verb: method as OpenAPIV3_1.HttpMethods,
                    path: pathObject as OpenAPIV3_1.PathItemObject,
                }

            }
        }
    }

    writeFileSync(outFile, 
`import { operations } from "./api_types"
import { AnyStatus, OperationInputWithoutRequestBody, OperationInputWithRequestBody} from "openapi-typescript-aws-handler";


${Object.entries(operations).map(([operationId, operation]) => {
    const allResponseTypes: string[] = [];
    const allResponseCodes = getResponseCodes(operation.operation);
    const nonDefaultReturns = allResponseCodes.filter(rc => rc !== 'default')

    const requestBody = operation.operation.requestBody ? deref<OpenAPIV3_1.RequestBodyObject>(operation.operation.requestBody, spec) : undefined;
    const requestBodyContentType = requestBody && Object.keys(requestBody.content).length > 0 ? Object.keys(requestBody.content)[0] : undefined;

    return `export namespace op_${operationId} {
    export type Operation = operations["${operationId}"]
    export type Responses = Operation["responses"];
    export type Parameters = Operation["parameters"];
    export type Handler = (input: Input) => Promise<Output>
    
    export type Input = {
        parameters: Parameters;
        ${ requestBodyContentType ? `contentType: "${requestBodyContentType}";
        body: Operation["requestBody"]["content"]["${requestBodyContentType}"];
` : ''}
    };        
    ${allResponseCodes.map(code => {
        const response = deref<OpenAPIV3_1.ResponseObject>(getResponse(operation.operation, code), spec);
        allResponseTypes.push(getResponseName(code));
        return generateResponseType(response, code, nonDefaultReturns);
    }).filter(x => x != undefined).join('')}

    export type Output = ${allResponseCodes.map(rc => getResponseName(rc)).join(' | ')};
}

`}).join('')}

export interface ${serviceName} {
    ${Object.keys(operations).map(operationId => `
    /**
     * ${operations[operationId].operation.description ?? ""}
     */
    ${operationId}: op_${operationId}.Handler;
`).join('')}
}
`)
}