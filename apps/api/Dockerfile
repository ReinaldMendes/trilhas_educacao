FROM node:20-alpine
WORKDIR /app

# System deps
RUN apk add --no-cache openssl postgresql-client

# Copy package manifest and install all deps (including devDeps for prisma CLI)
COPY package.json ./
RUN npm install

# Copy source and prisma schema
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY src ./src
COPY tsconfig.json ./

# Generate Prisma client (needs network — runs at build time with full internet)
RUN npx prisma generate

# Compile TypeScript to dist/
RUN npm run build

# Copy entrypoint
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

RUN mkdir -p uploads

ENV NODE_ENV=production

ENTRYPOINT ["./entrypoint.sh"]
