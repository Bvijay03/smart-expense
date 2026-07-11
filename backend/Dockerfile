FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL deps (need devDeps for build)
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client + build TypeScript
RUN npx prisma generate && npm run build

# Remove devDependencies for leaner image
RUN npm prune --production

EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
