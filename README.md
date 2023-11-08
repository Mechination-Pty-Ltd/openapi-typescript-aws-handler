This library extends upon the awesome [openapi-typescript](https://github.com/drwpow/openapi-typescript) library to create AWS lambda bindings for handling requests that are made to an [OpenAPI](https://www.openapis.org/) API. The intention is to make it as easy as possible to create a typescript handler that will accept requests from somewhere else (presumably an [(API gateway)](https://aws.amazon.com/api-gateway/)) and will execute some type safe(ish) code to process that request.  It assumes that all validation has already been performed by an upstream 

This library does no code-generation of its own.  It depends on *openapi-typescript* for that. Instead, it just provides some typescript type magic to provide a type-safe way of defining your handlers, and a simple wrapper that will take input and call your function.

> 🚧 NOTE
> ----
>
> This library does not currently vend or return AWS API Gateway proxy objects (as served by API Gateway) - This is because I have another wrapper around these objects, but I will add in another version of the wrapper that does work directly with Proxy request. You could write a trivial wrapper around this to do it yourself in the mean time.
>
> This library also assumes that you are transmitting and receiving JSON only. Some APIs may use different content types.  Its unclear to me whether my API adapter should auto-transform, or whether the API desginer should be given control - probably a mixture of both.  Transforming between YAML and JSON is trivial, and could easily be handled by the wrapper. 
>

# Usage

To use this library there are a couple of steps

1. Generate bindings for your application using [openapi-typescript](https://github.com/drwpow/openapi-typescript)
1. Create a lambda handler using the `makeOpenApiLambdaHandler` call from this package.  For example

    ```typescript
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
    ```
1. Set up your API gateway to use this lambda to handle requests. 



See the [example](example) directory for some simple examples