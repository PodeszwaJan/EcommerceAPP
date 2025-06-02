using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecommerce.Server.Models;

namespace Ecommerce.Server.Controllers
{
    /// <summary>
    /// API controller for managing products in the e-commerce system.
    /// Provides endpoints for CRUD operations on products.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly ECommerceContext _context;

        /// <summary>
        /// Initializes a new instance of the ProductsController.
        /// </summary>
        /// <param name="context">The database context for product operations</param>
        public ProductsController(ECommerceContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all products from the database.
        /// </summary>
        /// <returns>A list of all products</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            return await _context.Products.ToListAsync();
        }

        /// <summary>
        /// Retrieves a specific product by its ID.
        /// </summary>
        /// <param name="id">The ID of the product to retrieve</param>
        /// <returns>The requested product or NotFound if it doesn't exist</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            return product;
        }

        /// <summary>
        /// Updates an existing product.
        /// </summary>
        /// <param name="id">The ID of the product to update</param>
        /// <param name="product">The updated product data</param>
        /// <returns>NoContent if successful, BadRequest if ID mismatch, or NotFound if product doesn't exist</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, Product product)
        {
            if (id != product.Id)
            {
                return BadRequest();
            }

            _context.Entry(product).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        /// <summary>
        /// Creates a new product.
        /// </summary>
        /// <param name="product">The product data to create</param>
        /// <returns>The created product with its assigned ID</returns>
        [HttpPost]
        public async Task<ActionResult<Product>> PostProduct(Product product)
        {
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProduct", new { id = product.Id }, product);
        }

        /// <summary>
        /// Deletes a specific product.
        /// </summary>
        /// <param name="id">The ID of the product to delete</param>
        /// <returns>NoContent if successful, or NotFound if product doesn't exist</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Checks if a product exists in the database.
        /// </summary>
        /// <param name="id">The ID of the product to check</param>
        /// <returns>True if the product exists, false otherwise</returns>
        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.Id == id);
        }
    }
}
