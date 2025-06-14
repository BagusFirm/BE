FROM node:18-slim

ENV TZ=Asia/Jakarta
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install Python, pip, dan venv
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv build-essential && \
    apt-get clean

# Set working directory
WORKDIR /app

# Buat virtual environment untuk Python
RUN python3 -m venv /opt/venv

# Aktifkan venv dan install Python dependencies
COPY src/ml/requirements.txt ./src/ml/requirements.txt
RUN /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r ./src/ml/requirements.txt

# Tambah path venv ke ENV agar dipakai default
ENV PATH="/opt/venv/bin:$PATH"

# Install Node.js deps
COPY package*.json ./
RUN npm install

# Copy semua file project
COPY . .

# Railway port (ganti jika pakai selain 3000)
EXPOSE 3000

# Run Node.js
CMD ["npm", "start"]
