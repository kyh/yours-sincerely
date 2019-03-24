[![Dependencies Status](https://david-dm.org/its-bananas/yours-sincerely/status.svg)](https://david-dm.org/its-bananas/yours-sincerely)
[![Build Status](https://travis-ci.org/its-bananas/yours-sincerely.svg?branch=master)](https://travis-ci.org/its-bananas/yours-sincerely) [![Greenkeeper badge](https://badges.greenkeeper.io/its-bananas/yours-sincerely.svg)](https://greenkeeper.io/)

# Yours Sincerely

> Endless senseless collaborative book

To write is to put pen to paper or fingers to keyboard. If you have trouble falling asleep, write down all the thoughts swimming around your head before getting into bed as a way to clear your mind.

## Directory Layout

```
├── /client                      # ReactJS client, which contains most of our UI
│   ├── /components              # React components, reusable across all pages
│   ├── /pages                   # App route definitions
│   ├── /static                  # Static assets
│   └── /utils                   # Client side helper functions/Utilities/Services
│   └── next.config.js           # Next.js SSR configuration
│── /config                      # Environment configuration
│── /docs                        # App documentation
│── /prisma                      # Prisma datamodel and seed data
│── /server                      # Node.js server
│   ├── /config                  # Server environment variables
│   ├── /db                      # Prisma generated files and app schema
│   ├── /middlewares             # Express/Yoga middleware
│   ├── /resolvers               # GraphQl resolvers
│   ├── /services                # Server Helper functions/Utilities/Services
│   └── index.js                 # Server entry point
│── /tests                       # Test setup files
│── /tools                       # Setup and deployment scripts
└── /worker                      # JavaScript worker modules
```

## Want to contribute?

- [How can I help?](docs/how-to-help.md)
- [Setup your local YS instance](docs/setup.md)
- [Evolving the server](docs/server.md)
- [Using the GraphQL API](docs/graphql.md)
- [Updating the client](docs/client.md)
- [List of supported environment variables](docs/environment_variables.md)
- [The design process](docs/design.md)
- [Product Features](docs/product.md)

## Discussion

If you have any questions, ping us on Slack
(https://itsbananas.slack.com).
