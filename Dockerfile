FROM node:20-slim as builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source
COPY . .

# Build client
RUN cd client && npm run build

# Production image
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]
