# build and start
FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

ENTRYPOINT [ "npm", "run", "dev" ]