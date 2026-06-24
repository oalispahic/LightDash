FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY src ./src
COPY setup-users.js .
COPY init.sh .
RUN chmod +x init.sh
EXPOSE 3000
CMD ["sh", "init.sh"]
