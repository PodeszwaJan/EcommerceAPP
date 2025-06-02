# Build frontend
FROM node:18-alpine AS client-build
WORKDIR /ecommerce.client
COPY ecommerce.client/package*.json ./
RUN npm install
RUN npm install --save-dev @types/node
COPY ecommerce.client/ .

# Install openssl for certificate generation (if needed)
RUN apk add --no-cache openssl
# Disable SSL for Vite build in production
ENV VITE_SERVER_OPTIONS_HTTPS=false
ENV NODE_ENV=production
RUN npm run build

# Build backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS server-build
WORKDIR /src

# Copy the solution file and server project
COPY Ecommerce.Server/. Ecommerce.Server/

# Remove client project reference for Docker build
RUN sed -i '/<ProjectReference Include="..\\ecommerce.client\\ecommerce.client.esproj">/,/<\/ProjectReference>/d' Ecommerce.Server/Ecommerce.Server.csproj

# Restore and build server
RUN dotnet restore Ecommerce.Server/Ecommerce.Server.csproj
WORKDIR "/src/Ecommerce.Server"
RUN dotnet build "Ecommerce.Server.csproj" -c Release -o /app/build --no-restore
RUN dotnet publish "Ecommerce.Server.csproj" -c Release -o /app/publish --no-restore

# Final image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copy appsettings first to ensure it exists for the sed command
COPY Ecommerce.Server/appsettings.json .
RUN if [ -n "$DB_CONNECTION" ]; then sed -i "s|__DEFAULT_CONNECTION__|$DB_CONNECTION|g" appsettings.json; fi

# Copy the rest of the files
COPY --from=server-build /app/publish .
COPY --from=client-build /ecommerce.client/dist ./wwwroot

# Configure for Render
ENV PORT=10000
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

# Disable HTTPS redirection in production
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED=true

ENTRYPOINT ["dotnet", "Ecommerce.Server.dll"] 