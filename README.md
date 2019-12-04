# mighty-runner-authorizer

Provides lambda function and build infrastructure for an API Gateway authorizer to allow or deny
access to APIs for the MightyRunner application.

# Infrastructure

Infrastructure management is provided via AWS CloudFormation templates:
- **pipeline.template.yml** Describes the stack for a CodePipeline to build and deploy the application from a GitHub repo.  Required as a prerequisite to deploy the application
- **authorizer.template.yml** Describes the stack for the application itself, provisioning the lambda, DB and associated IAM configuration