# Enviroment Variables

| Environment Variable    | Config Name(name on the `config` file) | Description                                   |
|-------------------------|----------------------------------------|-----------------------------------------------|
| NODE_ENV                | .nodeEnv                               | Node Environment variable                     |
| JWT_SECRET              | .auth.jwtSecret                        | JWT secret                                    |
| PRISMA_ENDPOINT         | .db.prismaEndpoint                     | Prisma url endpoint                           |
| PRISMA_SECRET           | .db.prismaSecret                       | Prisma connection secret                      |
| PG_DATABASE             | .db.database                           | Postgres database name                        |
| PG_USERNAME             | .db.username                           | Postgres database username                    |
| PG_PASSWORD             | .db.password                           | Postgres database password                    |
| PG_HOST                 | .db.options.host                       | Postgres database host                        |
| PG_MAX_CONNECTIONS      | .db.options.pool.max                   | Postgres number of max connections to be open |
| STRIPE_CLIENT_ID        | .stripe.client_id                      | Stripe Client id                              |
| STRIPE_KEY              | .stripe.key                            | Stripe key                                    |
| STRIPE_SECRET           | .stripe.secret                         | Stripe secret                                 |
| AWS_KEY                 | .aws.key                               | AWS key                                       |
| AWS_SECRET              | .aws.secret                            | AWS secret                                    |
| AWS_S3_BUCKET           | .aws.bucket                            | AWS s3 bucket to send files                   |
| MAILGUN_USER            | .mailgun.user                          | Mailgun user                                  |
| MAILGUN_API_KEY         | .mailgun.apiKey                        | Mailgun password                              |
| API_URL                 | .host.api                              | API exposed url                               |
| APP_URL                 | .host.webapp                           | Webapp URL                                    |
| SLACK_HOOK_URL          | .slack.webhookUrl                      | Slack hook url                                |
| GOOGLE_CLIENT_ID        | .google.clientID                       | Google clientID for oauth                     |
| GOOGLE_CLIENT_SECRET    | .google.clientSecret                   | Google secret                                 |
| TWITTER_CONSUMER_KEY    | .twitter.consumerKey                   | Twitter key                                   |
| TWITTER_CONSUMER_SECRET | .twitter.consumerSecret                | Twitter secret                                |
| ALGOLIA_APP_ID          | .algolia.appId                         | Algolia APP id                                |
| ALGOLIA_KEY             | .algolia.appKey                        | Algolia key                                   |
| ALGOLIA_INDEX           | .algolia.index                         | Algolia index                                 |
