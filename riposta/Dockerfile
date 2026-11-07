FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY public ./public
ENV NODE_ENV=production PORT=3000 DATA_FILE=/data/db.json
VOLUME /data
EXPOSE 3000
CMD ["node", "server/server.js"]
