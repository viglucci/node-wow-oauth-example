FROM node:lts

WORKDIR /usr/src/app

RUN apt-get update \
    && apt-get -y install sudo \
    && sudo apt install imagemagick

ARG NODE_ENV=production

ADD . .

RUN npm install --quiet

CMD ["node", "server.js"]
