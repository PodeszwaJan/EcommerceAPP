using Ecommerce.Server.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Text.Json.Serialization;

namespace Ecommerce.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

           
            var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? throw new InvalidOperationException("Database connection string not found in DB_CONNECTION_STRING environment variable");
                

            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
            }

            builder.Services.AddDbContext<ECommerceContext>(options =>
                options.UseSqlServer(connectionString));

            // Add services to the container.
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                    options.JsonSerializerOptions.WriteIndented = true;
                });

            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                });
            });

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
                app.UseHttpsRedirection(); // Only redirect in development
            }

            // Serve static files and enable default files
            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseCors();
            app.UseAuthorization();

            app.MapControllers();

            // Configure SPA fallback
            app.MapWhen(ctx => !ctx.Request.Path.StartsWithSegments("/api"), builder =>
            {
                builder.UseStaticFiles();
                builder.UseRouting();
                builder.UseEndpoints(endpoints =>
                {
                    endpoints.MapFallbackToFile("index.html");
                });
            });

            app.Run();
        }
    }
}