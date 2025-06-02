using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecommerce.Server.Models;

namespace Ecommerce.Server.Controllers
{
    /// <summary>
    /// Controller for health checks and system status
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        private readonly ECommerceContext _context;

        public HealthController(ECommerceContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Checks if the database connection is working
        /// </summary>
        /// <returns>200 OK if connection is successful, 503 Service Unavailable if connection fails</returns>
        [HttpGet]
        public async Task<IActionResult> CheckHealth()
        {
            try
            {
                // Try to connect to the database
                await _context.Database.CanConnectAsync();
                return Ok(new { status = "healthy", message = "Database connection is working" });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { status = "unhealthy", message = "Database connection failed", error = ex.Message });
            }
        }
    }
} 