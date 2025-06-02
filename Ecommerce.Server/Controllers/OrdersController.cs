using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecommerce.Server.Models;
using System.Text.Json.Serialization;

namespace Ecommerce.Server.Controllers
{
    /// <summary>
    /// Data transfer object for order responses.
    /// Provides a simplified view of orders with string-based status.
    /// </summary>
    public class OrderResponse
    {
        public int Id { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public string ShippingAddress { get; set; }
        public DateTime OrderDate { get; set; }
        public string Status { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; }

        /// <summary>
        /// Converts an Order entity to an OrderResponse DTO.
        /// </summary>
        /// <param name="order">The order entity to convert</param>
        /// <returns>An OrderResponse object</returns>
        public static OrderResponse FromOrder(Order order)
        {
            return new OrderResponse
            {
                Id = order.Id,
                CustomerName = order.CustomerName,
                CustomerEmail = order.CustomerEmail,
                ShippingAddress = order.ShippingAddress,
                OrderDate = order.OrderDate,
                Status = order.Status.ToString(),
                OrderItems = order.OrderItems
            };
        }
    }

    /// <summary>
    /// API controller for managing orders in the e-commerce system.
    /// Provides endpoints for CRUD operations on orders with proper stock management.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ECommerceContext _context;

        /// <summary>
        /// Initializes a new instance of the OrdersController.
        /// </summary>
        /// <param name="context">The database context for order operations</param>
        public OrdersController(ECommerceContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all orders with their related items and products.
        /// </summary>
        /// <returns>A list of all orders with their details</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderResponse>>> GetOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .ToListAsync();

            return orders.Select(OrderResponse.FromOrder).ToList();
        }

        /// <summary>
        /// Retrieves a specific order by its ID, including related items and products.
        /// </summary>
        /// <param name="id">The ID of the order to retrieve</param>
        /// <returns>The requested order or NotFound if it doesn't exist</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderResponse>> GetOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            return OrderResponse.FromOrder(order);
        }

        /// <summary>
        /// Updates an existing order with stock management.
        /// Handles product availability and updates stock quantities accordingly.
        /// </summary>
        /// <param name="id">The ID of the order to update</param>
        /// <param name="order">The updated order data</param>
        /// <returns>NoContent if successful, BadRequest if validation fails, or NotFound if order doesn't exist</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrder(int id, Order order)
        {
            if (id != order.Id)
            {
                return BadRequest();
            }

            // Get existing order with its items
            var existingOrder = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (existingOrder == null)
            {
                return NotFound();
            }

            // Create a dictionary of current order items for easy lookup
            var currentItems = existingOrder.OrderItems.ToDictionary(item => item.ProductId, item => item);

            // Start a transaction for data consistency
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Update basic order information
                existingOrder.CustomerName = order.CustomerName;
                existingOrder.CustomerEmail = order.CustomerEmail;
                existingOrder.ShippingAddress = order.ShippingAddress;
                
                // Validate and update order status
                if (Enum.TryParse<OrderStatus>(order.Status.ToString(), true, out OrderStatus status))
                {
                    existingOrder.Status = status;
                }
                else
                {
                    return BadRequest($"Invalid order status: {order.Status}");
                }

                // Validate product availability and update stock quantities
                foreach (var item in order.OrderItems)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null)
                    {
                        return BadRequest($"Product with ID {item.ProductId} not found");
                    }

                    // Calculate stock quantity changes
                    int quantityDifference = item.Quantity;
                    if (currentItems.TryGetValue(item.ProductId, out var currentItem))
                    {
                        quantityDifference -= currentItem.Quantity;
                    }

                    // Ensure sufficient stock is available
                    if (product.StockQuantity < quantityDifference)
                    {
                        return BadRequest($"Not enough stock for product '{product.Name}'. Available: {product.StockQuantity}");
                    }

                    // Update product stock
                    product.StockQuantity -= quantityDifference;
                }

                // Update order items
                _context.OrderItems.RemoveRange(existingOrder.OrderItems);

                foreach (var item in order.OrderItems)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    var orderItem = new OrderItem
                    {
                        OrderId = id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        Order = existingOrder,
                        Product = product
                    };

                    existingOrder.OrderItems.Add(orderItem);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }

            return NoContent();
        }

        /// <summary>
        /// Creates a new order with stock management.
        /// Validates product availability and updates stock quantities.
        /// </summary>
        /// <param name="order">The order data to create</param>
        /// <returns>The created order with its assigned ID, or BadRequest if validation fails</returns>
        [HttpPost]
        public async Task<ActionResult<OrderResponse>> PostOrder(Order order)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Set order metadata
                order.OrderDate = DateTime.UtcNow;

                // Validate order status
                if (Enum.TryParse<OrderStatus>(order.Status.ToString(), true, out OrderStatus status))
                {
                    order.Status = status;
                }
                else
                {
                    return BadRequest(new { message = $"Invalid order status: {order.Status}" });
                }

                // Validate product availability and update stock
                foreach (var item in order.OrderItems)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null)
                    {
                        return BadRequest(new { message = $"Product with ID {item.ProductId} not found" });
                    }

                    // Ensure sufficient stock is available
                    if (product.StockQuantity < item.Quantity)
                    {
                        return BadRequest(new { message = $"Not enough stock for product '{product.Name}'. Available: {product.StockQuantity}" });
                    }

                    // Update product stock
                    product.StockQuantity -= item.Quantity;
                }

                // Create new order record
                var newOrder = new Order
                {
                    CustomerName = order.CustomerName,
                    CustomerEmail = order.CustomerEmail,
                    ShippingAddress = order.ShippingAddress,
                    Status = order.Status,
                    OrderDate = order.OrderDate,
                    OrderItems = new List<OrderItem>()
                };

                _context.Orders.Add(newOrder);
                await _context.SaveChangesAsync();

                // Create order items with current product prices
                foreach (var item in order.OrderItems)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    var orderItem = new OrderItem
                    {
                        OrderId = newOrder.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = product.Price,
                        Order = newOrder,
                        Product = product
                    };

                    newOrder.OrderItems.Add(orderItem);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Return the complete order with items
                var createdOrder = await _context.Orders
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                    .FirstOrDefaultAsync(o => o.Id == newOrder.Id);

                return OrderResponse.FromOrder(createdOrder);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Deletes a specific order.
        /// </summary>
        /// <param name="id">The ID of the order to delete</param>
        /// <returns>NoContent if successful, or NotFound if order doesn't exist</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            _context.OrderItems.RemoveRange(order.OrderItems);
            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Checks if an order exists in the database.
        /// </summary>
        /// <param name="id">The ID of the order to check</param>
        /// <returns>True if the order exists, false otherwise</returns>
        private bool OrderExists(int id)
        {
            return _context.Orders.Any(e => e.Id == id);
        }
    }
}
