FROM node:20-slim

RUN apt-get update && apt-get install -y python3 python3-pip --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN pip3 install pypdf "cryptography==41.0.7" --break-system-packages

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/crm-builder-web/package.json ./apps/crm-builder-web/
RUN npm ci --workspace=@jungle/crm-builder-web --ignore-scripts
COPY apps/crm-builder-web ./apps/crm-builder-web
RUN npm run build --workspace=@jungle/crm-builder-web

WORKDIR /app/apps/crm-builder-web
ENV NODE_ENV=production
ENV PORT=3006
EXPOSE 3006
CMD ["npm", "run", "start"]
