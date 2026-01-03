FROM node:20-alpine

# Устанавливаем зависимости для компиляции native модулей
RUN apk add --no-cache python3 py3-pip make g++

WORKDIR /app

# Копируем package.json бэкенда
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm install --production

# Копируем исходники бэкенда
COPY server.js balancer.js database.js ./

# Копируем pre-built фронтенд
COPY client/build ./client/build

# Создаем директории для данных
RUN mkdir -p /app/data /app/logs

# Открываем порты
EXPOSE 7777 9000

# Запускаем приложение
CMD ["node", "server.js"]
