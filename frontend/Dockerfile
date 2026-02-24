FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/
ARG VITE_DEFAULT_WEDDING_ID=1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_DEFAULT_WEDDING_ID=${VITE_DEFAULT_WEDDING_ID}

RUN npm run build

FROM nginx:1.27-alpine

# Template is substituted at runtime so proxy_pass gets the backend URL (envsubst in image)
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/entrypoint.sh /entrypoint.sh
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
