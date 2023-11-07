This library extends upon the awesome (openapi-typescript)[https://github.com/drwpow/openapi-typescript] library to create AWS lambda bindings for handling requests that are made to an (OpenAPI)[https://www.openapis.org/] library. The intention is to make it as easy as possible to create a typescript handler that will accept requests from somewhere else (presumably an (API gateway)[https://aws.amazon.com/api-gateway/]) and will execute some type safe(ish) code to process that request.  It assumes that all validation has already been performed by an upstream 

This library does no code-generation of its own.  It depends on *openapi-typescript* for that. Instead, it just provides some typescript type magic to provide a type-safe way of defining your handlers, and a simple wrapper that will take input and call your function.


# Usage

To use this, there are a couple of steps

1. Generate bindings for your application using (openapi-typescript)[https://github.com/drwpow/openapi-typescript]
1. Create a lambda handler using the `makeOpenApiLambdaHandler` call from this package.  For example

    ```typescript
    import { AcceptedResponse, NoContentResponse, OperationHandler, makeOpenApiLambdaHandler, Non2xxResult } from "openapi-typescript-aws-handler"
    import { operations, components,  } from "./api_types"  // This is the file you generated using openapi-typescript

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
    const echoInput: OperationHandler<operations["echoInput"]> = async ({ queryParameters }) => {
        const next_token = queryParameters?.next_token;
        const num_items = queryParameters?.num_items ?? 20;
        logger.info("Executing listApplication", { next_token, num_items });

        // For demo purposes, we execute differently based upon a mock query parameter passed in
        if (queryParameters.mock == 'fail') {
            throw new ApiError("you told me to fail", 500);
        } else if (queryParameters.mock == 'not_found') {
            throw new ApiError("Not Found", 404);
        }

        return {
            status: 200,
            content: {
                items: []
            }
        }
    }

    export const handler = makeOpenApiLambdaHandler<operations>({
        echoInput,
    })
    ```
1. Set up your API gateway to use this lambda to handle requests. 