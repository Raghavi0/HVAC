FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json frontend/
RUN npm install
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build
FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
