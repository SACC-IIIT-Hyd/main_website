# build and start
FROM node:20-slim as build
WORKDIR /app
ENTRYPOINT [ "npm", "run", "dev" ]