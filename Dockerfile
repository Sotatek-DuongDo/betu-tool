ARG NODE_VERSION=14

FROM node:${NODE_VERSION}-alpine as build
RUN echo "Node $(node -v) / NPM v$(npm -v) / YARN v$(yarn -v)"
WORKDIR /usr/src/app
COPY ./package.json ./yarn.lock ./
COPY . ./
RUN yarn install
RUN yarn build

FROM node:${NODE_VERSION}-alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/.output ./

ENV PORT 8000
ENV HOST 0.0.0.0
EXPOSE 8000
CMD ["node", "server/index.mjs"]
