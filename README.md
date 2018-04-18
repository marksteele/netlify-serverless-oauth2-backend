# netlify-serverless-oauth2-backend

This is an AWS Lambda based service to help perform authentication to Github via an OAuth2 authentication process.


## Installation

```
sudo npm -i serverless -g
npm i
```

## Configuration

This code can be run either locally (using the serverless-offline plugin) or deployed in AWS.

### Offline

To run it locally:

```
sls offline
```

Before running it, update auth.js to reflect your desired configuration. The settings are defined in the initialization of the Secrets class:

```
// Change this stuff in auth.js to reflect your own dev testing
const secrets = new Secrets({
  GIT_HOSTNAME: 'https://github.com',
  OAUTH_TOKEN_PATH: '/login/oauth/access_token',
  OAUTH_AUTHORIZE_PATH: '/login/oauth/authorize',
  OAUTH_CLIENT_ID: 'foo',
  OAUTH_CLIENT_SECRET: 'bar',
  REDIRECT_URL: 'http://localhost:3000/callback',
  OAUTH_SCOPES: 'repo,user',
});
```

For this to work you'll also need to have your OAuth2 app setup properly in Github (and redirecting to the same callback url).

### AWS Deployment

To deploy the Lambda function, you'll need to update serverless.yml and set your KMS key for the parameter store.

To grab the key id:

```
aws kms describe-key --key-id alias/aws/ssm --profile <YOURAWSPROFILE> --region <REGION>
```

ex:

```
aws kms describe-key --key-id alias/aws/ssm --profile ctrl-alt-del --region us-east-1
```

If you're unfamiliar with AWS profiles, see this documentation: https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html

Once you've added your key uuid to the serverless.yml configuration (mapping it to the correct region and stage), it's time to deploy the code.

```
sls deploy -s <STAGE> --aws-profile <YOURAWSPROFILE> --region <REGION>
```

Ex:

```
sls deploy -s prod --aws-profile ctrl-alt-del --region us-east-1
```

Finally, once the code is deployed you need to add some parameters to the AWS parameter store.

Head on over to the AWS console, find the Systems manager, and go to the Parameter store.

In there, you'll want to create the following parameters/values (as SecureStrings), making sure to replace `STAGE` with your stage (eg: prod):

* /ctrl-alt-del/oauth/`STAGE`/GIT_HOSTNAME - The github host to use. Ex: https://github.com
* /ctrl-alt-del/oauth/`STAGE`/OAUTH_TOKEN_PATH - The token api uri path. Most probably this: /login/oauth/access_token
* /ctrl-alt-del/oauth/`STAGE`/OAUTH_AUTHORIZE_PATH - The authorize api uri path. Most probably this: /login/oauth/authorize 
* /ctrl-alt-del/oauth/`STAGE`/OAUTH_CLIENT_ID - Your Github OAuth client id
* /ctrl-alt-del/oauth/`STAGE`/OAUTH_CLIENT_SECRET - Your Github OAuth client secret
* /ctrl-alt-del/oauth/`STAGE`/REDIRECT_URL - Your callback URL. It will look something like this: https://`RANDOMSTUFF`.execute-api.us-east-1.amazonaws.com/`STAGE`/callback
* /ctrl-alt-del/oauth/`STAGE`/OAUTH_SCOPES - The scopes to grant. Probably this: repo,user

