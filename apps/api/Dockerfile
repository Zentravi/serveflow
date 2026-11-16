FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts

COPY dist ./dist
COPY prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/main"]
