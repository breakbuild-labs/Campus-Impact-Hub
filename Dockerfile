FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source files
COPY index.html ./
COPY server.js ./
COPY css ./css
COPY js ./js
COPY db ./db

# Create local data directory for persistent database storage
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]
