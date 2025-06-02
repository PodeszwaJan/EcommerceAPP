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
            var connectionString = Environment.GetEnvironmentVariable("RENDER_DB_CONNECTION");
            
            // Log connection string for debugging (mask sensitive info)
            if (!string.IsNullOrEmpty(connectionString))
            {
                Console.WriteLine("Connection string format validation starting...");
                try
                {
                    // Validate connection string format
                    var builder = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(connectionString);
                    Console.WriteLine("Connection string format is valid.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Connection string format error: {ex.Message}");
                    throw;
                }
            }
            else
            {
                throw new InvalidOperationException("RENDER_DB_CONNECTION environment variable is not set");
            }

            // Configure Entity Framework with SQL Server
            builder.Services.AddDbContext<ECommerceContext>(options =>
            {
                options.UseSqlServer(connectionString, sqlServerOptions =>
                {
                    sqlServerOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null
                    );
                });
            });

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

            // Configure static file serving
            app.UseDefaultFiles();
            app.UseStaticFiles();

            // Disable HTTPS redirection in production (since we're behind Render's proxy)
            if (!app.Environment.IsProduction())
            {
                app.UseHttpsRedirection();
            }

            app.UseCors(); // Enable CORS
            app.UseAuthorization(); // Enable authorization

            // Configure routing
            app.MapControllers(); // Enable controller endpoints
            app.MapFallbackToFile("index.html"); // SPA fallback routing

            app.Run();
        }
    }
}