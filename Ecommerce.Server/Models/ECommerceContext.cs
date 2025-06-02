using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Server.Models
{


        public class ECommerceContext : DbContext
        {
            public ECommerceContext(DbContextOptions<ECommerceContext> options) : base(options)
            {
            }

        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                // Wymuszamy użycie bazy danych Ecomm
                var connectionString = optionsBuilder.Options.FindExtension<Microsoft.EntityFrameworkCore.SqlServer.Infrastructure.Internal.SqlServerOptionsExtension>()?.ConnectionString;
                if (connectionString != null)
                {
                    connectionString = connectionString.Replace("Initial Catalog=Ecommerce", "Initial Catalog=Ecomm");
                    optionsBuilder.UseSqlServer(connectionString);
                }
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<OrderItem>()
                .HasKey(oi => new { oi.OrderId, oi.ProductId });

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(oi => oi.ProductId);

            // Add this configuration for decimal properties
            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasPrecision(18, 2); // 18 digits total, with 2 after the decimal point

            // Also configure the Price property in Product if it's not already done
            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);
        }
    }
}

