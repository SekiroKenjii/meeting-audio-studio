FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Use npm install since package-lock.json is not committed to repo
RUN npm install --only=production

# Copy start script first
COPY start.sh ./

# Make start script executable
RUN chmod +x start.sh

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start using the custom start script
CMD ["./start.sh"]
