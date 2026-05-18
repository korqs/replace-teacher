FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .
# ВРЕМЕННО: Прописываем переменные для почты
ENV EMAIL_ENABLED=true
ENV SMTP_HOST=smtp.yandex.ru
ENV SMTP_PORT=465
ENV SMTP_USER=ТВОЙ_EMAIL@yandex.ru
ENV SMTP_PASS=ТВОЙ_ПАРОЛЬ_ПРИЛОЖЕНИЯ
ENV SMTP_FROM=ТВОЙ_EMAIL@yandex.ru
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
