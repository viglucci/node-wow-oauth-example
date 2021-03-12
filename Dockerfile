FROM node:lts

WORKDIR /usr/src/app

ARG NODE_ENV=production

ADD . .

RUN npm install --quiet

CMD ["node", "server.js"]
