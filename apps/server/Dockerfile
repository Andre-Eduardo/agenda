FROM node:20-alpine as builder

WORKDIR /app

# Add dependencies on a separate layer for better caching
COPY package*.json ./
COPY ./node_modules ./node_modules/
COPY prisma ./prisma/

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/prisma ./prisma/

RUN apk update && apk add bash

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
