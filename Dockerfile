# Gunakan base image Node.js + Debian untuk bisa install Python
FROM node:18-slim

# Set timezone dan environment variables
ENV TZ=Asia/Jakarta
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install Python3, pip, dan tools lain yang dibutuhkan
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-dev build-essential && \
    apt-get clean

# Set working directory
WORKDIR /app

# Copy file dependency Node.js
COPY package*.json ./

# Install dependency Node.js
RUN npm install

# Copy seluruh project
COPY . .

# Install dependency Python
RUN pip3 install --no-cache-dir -r ./src/ml/requirements.txt

# Buka port yang akan dipakai Railway
EXPOSE 3000

# Jalankan server Node.js
CMD ["npm", "start"]
