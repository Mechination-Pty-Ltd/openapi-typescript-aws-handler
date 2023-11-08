This is an example project showing how to create a lambda function to handle OpenAPI.  It only shows the structure, now how you would package and deploy the lambda.  I would recommend (AWS CDK)[https://aws.amazon.com/cdk/] as one such mechanism.


# The Source API
The API is defined in (openapi.yaml)[openapi.yaml]

# Building

1. Install dependencies as you would normally (I use pnpm)
1. As this depends on openapi-typescript, run `npm run generate` to create the typescript types for your API.
1. Build and deploy as you normally would. 