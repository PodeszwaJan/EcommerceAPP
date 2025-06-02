namespace Ecommerce.Server.Models
{
    public class Order
    {
        public int Id { get; set; }
        public required string CustomerName { get; set; }
        public required string CustomerEmail { get; set; }
        public required string ShippingAddress { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public required ICollection<OrderItem> OrderItems { get; set; }
    }

    public enum OrderStatus
    {
        Pending,
        Processing,
        Shipped,
        Delivered,
        Cancelled
    }
}
