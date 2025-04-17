# Stage development
FROM node:22.2.0-alpine AS development
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy app source dan generate Prisma Client
COPY . .
RUN npm run prisma:generate

# Stage build
FROM node:22.2.0-alpine AS build
WORKDIR /usr/src/app

# Copy dari development stage dengan user yang konsisten
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY . .

# Build aplikasi
RUN npm run build

# Stage production
FROM node:22.2.0-alpine AS production
WORKDIR /usr/src/app

# Copy artifacts dengan user yang konsisten
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

EXPOSE ${PORT}

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm run start:prod; else npm run start:dev; fi"]