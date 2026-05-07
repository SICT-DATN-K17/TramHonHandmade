FROM node:18-alpine

WORKDIR /app

# Copy các file quản lý gói và cài đặt thư viện
COPY package*.json ./
RUN npm install

# Copy source code và build
COPY . .
RUN npm run build

# Mở cổng 3000
EXPOSE 3000

# Khởi chạy Next.js
CMD ["npm", "start"]