# node-wow-oauth-example - Node.js

This application serves as an example node.js application for consuming OAuth APIs exposed for [World of Warcraft](https://develop.battle.net/documentation/world-of-warcraft). This codebase was orginally forked and expanded on from https://github.com/Blizzard/node-signature-generator.

Explore the example on [Heroku](https://node-wow-oauth-example.herokuapp.com/).

![Image one of example UI](./node-wow-oauth-example-1.png)
![Image two of example UI](./node-wow-oauth-example-2.png)

## OAuth

This application leverages and exercises the Client Credentials and the Authorization Code flows.

### Client Credentials Flow

The app leverages the Client Credentials flow to retrieve an OAuth token and then generate a PNG image for any given character.

### Code Authorization Flow

The app leverages the Code Authorization flow by integrating the [passport](http://www.passportjs.org/) and [passport-bnet](https://github.com/Blizzard/passport-bnet) libraries to support user login through Blizzard's Battle.net.

### Sessions & Redis

This application leverage Redis as a remote session store, which allows for the usage of the [throng](https://www.npmjs.com/package/throng) library to spawn multiple node.js processes and keep the user logged in regardless of which node.js process handles their HTTP request.

## API Usage

In accordance with the [World of Warcraft Community API Migration](https://develop.battle.net/documentation/world-of-warcraft/community-api-migration-status) this application leverages only the WoW Game Data APIs.

## Getting Started

To get started experimenting with this application, you will first need to follow the [getting started guide](https://develop.battle.net/documentation/guides/getting-started) to create a new OAuth client on develop.battle.net.

## Configuration

Once you have created your OAuth client on develop.battle.net, copy the `.env.example` file to `.env`, and fill in the values for the `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` variables. The values from the `.env` file will be loaded by the [dotenv](https://www.npmjs.com/package/dotenv) library at startup.

## Docker Support

To simplify the redis dependencies described above, this application is also set up to run in a docker container with an existing [docker-compose](https://docs.docker.com/compose/) file already written for convenience.

You can run the application easily by invoking the `docker-compose -f docker-compose.yml up` command in a command-line shell, granted that you already have [Docker](https://www.docker.com/products/docker-desktop) installed on your system.

## Development

Should you wish to experiment with this code and make changes, the application is setup to work with [nodemon](https://www.npmjs.com/package/nodemon) to watch the filesystem and restart anytime a `.js` file is changed. This functionality is enabled by default when runing with the above docker-compose command.
