import { OperationHandler, makeOpenApiLambdaHandler, Non2xxResult } from "openapi-typescript-aws-handler"
import { operations, components,  } from "./api"  // This is the file you generated using openapi-typescript

/**
 * Makes it easier to throw the API specific ApiError.
 */
class ApiError extends Non2xxResult<components['schemas']['ApiError']> {
    constructor(message: string, code: number = 500) {
        super({ message }, code)
    }
}


/**
 *  Handler for the *echoInput* operation
 */
const echoInput: OperationHandler<operations["echoInput"]> = async ({ body, params }) => {

    // For demo purposes, we execute differently based upon a mock query parameter passed in
    const mockParam = params?.query?.mock;
    if (mockParam) {
        switch (mockParam) {
            case 'fail':
                throw new ApiError("you told me to fail", 500);
            case 'not_found':
                throw new ApiError("Not Found", 404);
        }
    }

    if (!body) {
        throw new ApiError("No body supplied");
    }

    return {
        status: 200,
        content: {
            response: body.input
        }
    };
}

export const handler = makeOpenApiLambdaHandler<operations>({
    echoInput,
});