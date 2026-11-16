FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts

COPY .next ./.next
COPY public ./public

EXPOSE 3000

CMD ["node", "server.js"]
