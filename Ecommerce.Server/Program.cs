using Ecommerce.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace Ecommerce.Server
{
    /// <summary>
    /// Main entry point for the E-commerce application.
    /// Configures and initializes the ASP.NET Core web application.
    /// </summary>
    public class Program
    {
        /// <summary>
        /// Application entry point. Sets up the web application with required services and middleware.
        /// </summary>
        /// <param name="args">Command line arguments</param>
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Database Configuration
            // Connection string priority:
            // 1. RENDER_DB_CONNECTION environment variable (production)
            // 2. DatabaseConnection from appsettings.json
            var connectionString = Environment.GetEnvironmentVariable("RENDER_DB_CONNECTION")
                ?? builder.Configuration.GetConnectionString("DatabaseConnection");

            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("No database connection string found. Please set either RENDER_DB_CONNECTION environment variable or DatabaseConnection in appsettings.json");
            }

            // Configure Entity Framework with SQL Server
            builder.Services.AddDbContext<ECommerceContext>(options =>
                options.UseSqlServer(connectionString));

            // Configure JSON serialization options
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    // Prevent circular references in JSON serialization
                    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.WriteIndented = true;
                });

            // Configure CORS to allow requests from any origin
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                });
            });

            // Enable Swagger/OpenAPI documentation
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline
            if (app.Environment.IsDevelopment())
            {
                // Enable Swagger UI in development environment
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // Configure middleware pipeline
            app.UseDefaultFiles(); // Serve default files like index.html
            app.UseHttpsRedirection(); // Redirect HTTP to HTTPS
            app.UseCors(); // Enable CORS
            app.UseAuthorization(); // Enable authorization

            // Configure routing
            app.MapControllers(); // Enable controller endpoints
            app.MapFallbackToFile("/index.html"); // SPA fallback routing

            app.Run();
        }
    }
}