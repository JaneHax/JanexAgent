FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache chromium

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx playwright install chromium

EXPOSE 3000 3001

CMD ["npm", "start"]
