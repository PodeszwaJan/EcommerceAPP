import axios from 'axios';
import type { Product, Order } from '../api/models';

/**
 * Determines the base URL for API requests based on the current environment.
 * @returns {string} The base URL for API requests
 */
const getBaseUrl = () => {
    if (import.meta.env.PROD) {
        // Production environment: Use relative URL since frontend and backend are served from the same domain
        return '/api';
    }
    // Development environment: Use the full localhost URL
    return 'https://localhost:7094/api';
};

/**
 * Axios instance configured for the e-commerce API
 * Includes default headers and base URL configuration
 */
const apiClient = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

/**
 * Request interceptor for logging and debugging API requests
 * Logs URL, method, headers, and request data
 */
apiClient.interceptors.request.use(
    (config) => {
        const url = config.baseURL || '' + (config.url || '');
        console.log('Request URL:', url);
        console.log('Request Method:', config.method?.toUpperCase());
        console.log('Request Headers:', config.headers);
        console.log('Request Data:', config.data);
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

/**
 * Response interceptor for logging and error handling
 * Provides detailed error information and consistent error messages
 */
apiClient.interceptors.response.use(
    (response) => {
        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
        return response;
    },
    (error) => {
        if (error.response) {
            // Handle server responses with error status codes (4xx, 5xx)
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Headers:', error.response.headers);
            console.error('Error Response Data:', error.response.data);
            
            const errorMessage = typeof error.response.data === 'string' 
                ? error.response.data 
                : error.response.data?.message || 'Server error occurred';
            
            throw new Error(errorMessage);
        } else if (error.request) {
            // Handle network errors or no response from server
            console.error('No Response Received');
            console.error('Request Details:', error.request);
            throw new Error('Could not connect to the server. Please check if the backend is running.');
        } else {
            // Handle request setup errors
            console.error('Request Setup Error:', error.message);
            throw new Error('Error setting up the request: ' + error.message);
        }
    }
);

export const getProducts = async () => {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
};

export const getProduct = async (id: number) => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
};

/**
 * Creates a new product in the system
 * @param product Product data without ID
 * @returns Promise containing the created product with ID
 */
export const createProduct = async (product: Omit<Product, 'id'>) => {
    try {
        // Sanitize and validate input data
        const productData = {
            name: product.name.trim(),
            description: product.description?.trim() || '',
            price: parseFloat(product.price.toString()),
            stockQuantity: parseInt(product.stockQuantity.toString())
        };

        console.log('Sending product data:', productData);
        
        const response = await apiClient.post<Product>('/products', productData);
        console.log('Product created successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to create product:', error);
        throw error;
    }
};

/**
 * Updates an existing product
 * @param id Product ID to update
 * @param product Updated product data
 * @returns Promise containing the updated product
 */
export const updateProduct = async (id: number, product: Partial<Product>) => {
    try {
        // Validate required fields
        if (!product.name || product.price === undefined || product.stockQuantity === undefined) {
            throw new Error('Missing required fields for product update');
        }

        // Sanitize and validate input data
        const productData = {
            id: id,
            name: product.name.trim(),
            description: product.description?.trim() || '',
            price: parseFloat(product.price.toString()),
            stockQuantity: parseInt(product.stockQuantity.toString())
        };

        console.log(`Updating product ${id} with data:`, productData);
        
        const response = await apiClient.put<Product>(`/products/${id}`, productData);
        console.log('Product updated successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Failed to update product. Details:', {
            error,
            errorMessage: error.message,
            responseData: error.response?.data,
            status: error.response?.status
        });
        
        // Handle various error response formats
        if (error.response?.data) {
            if (typeof error.response.data === 'string') {
                throw new Error(error.response.data);
            } else if (error.response.data.message) {
                throw new Error(error.response.data.message);
            } else if (error.response.data.errors) {
                const validationErrors = Object.values(error.response.data.errors).flat().join(', ');
                throw new Error(`Validation failed: ${validationErrors}`);
            }
        }
        
        throw new Error('Failed to update product. Please check the console for details.');
    }
};

export const deleteProduct = async (id: number) => {
    await apiClient.delete(`/products/${id}`);
};

export const getOrders = async () => {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data;
};

export const getOrder = async (id: number) => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
};

/**
 * Creates a new order in the system
 * @param order Order data without ID and orderDate
 * @returns Promise containing the created order
 */
export const createOrder = async (order: Omit<Order, 'id' | 'orderDate'>) => {
    try {
        // Sanitize and validate input data
        const orderData = {
            customerName: order.customerName.trim(),
            customerEmail: order.customerEmail.trim(),
            shippingAddress: order.shippingAddress.trim(),
            status: convertStatusToEnum(order.status),
            orderDate: new Date().toISOString(),
            orderItems: order.orderItems.map(item => ({
                productId: item.productId,
                quantity: Math.max(1, Math.floor(Number(item.quantity))),
                unitPrice: Number(item.unitPrice.toFixed(2))
            }))
        };

        // Debug logging
        console.log('Creating order with data:', {
            rawOrder: order,
            formattedOrder: orderData,
            orderItemsCount: orderData.orderItems.length,
            status: {
                original: order.status,
                converted: orderData.status
            }
        });
        
        const response = await apiClient.post<Order>('/orders', orderData);
        console.log('Order created successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Failed to create order. Detailed error information:', {
            error,
            errorMessage: error.message,
            responseData: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
            validationErrors: error.response?.data?.errors,
            requestData: error.config?.data ? JSON.parse(error.config.data) : null
        });
        
        // Handle various error response formats
        if (error.response?.data) {
            console.log('Server response data:', error.response.data);
            
            if (typeof error.response.data === 'string') {
                throw new Error(error.response.data);
            } else if (error.response.data.message) {
                throw new Error(error.response.data.message);
            } else if (error.response.data.errors) {
                const validationErrors = Object.entries(error.response.data.errors)
                    .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
                    .join('; ');
                throw new Error(`Validation failed: ${validationErrors}`);
            }
        }
        
        throw new Error('Failed to create order. Please check the console for details.');
    }
};

export const updateOrder = async (id: number, order: Partial<Order>) => {
    try {
        // Ensure all required fields are present
        if (!order.customerName || !order.customerEmail || !order.shippingAddress || !order.status || !order.orderItems) {
            throw new Error('Missing required fields for order update');
        }

        const orderData = {
            id: id,
            customerName: order.customerName.trim(),
            customerEmail: order.customerEmail.trim(),
            shippingAddress: order.shippingAddress.trim(),
            status: convertStatusToEnum(order.status),
            orderDate: order.orderDate || new Date().toISOString(),
            orderItems: order.orderItems.map(item => ({
                orderId: id, // Add orderId for the relationship
                productId: item.productId,
                quantity: Math.max(1, Math.floor(Number(item.quantity))),
                unitPrice: Number(item.unitPrice.toFixed(2)) // Ensure decimal precision
            }))
        };

        console.log(`Updating order ${id} with data:`, orderData);
        
        const response = await apiClient.put<Order>(`/orders/${id}`, orderData);
        console.log('Order updated successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Failed to update order. Detailed error information:', {
            error,
            errorMessage: error.message,
            responseData: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
            validationErrors: error.response?.data?.errors,
            requestData: error.config?.data ? JSON.parse(error.config.data) : null
        });
        
        if (error.response?.data) {
            console.log('Server response data:', error.response.data);
            
            if (typeof error.response.data === 'string') {
                throw new Error(error.response.data);
            } else if (error.response.data.message) {
                throw new Error(error.response.data.message);
            } else if (error.response.data.errors) {
                const validationErrors = Object.entries(error.response.data.errors)
                    .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
                    .join('; ');
                throw new Error(`Validation failed: ${validationErrors}`);
            }
        }
        
        throw new Error('Failed to update order. Please check the console for details.');
    }
};

export const deleteOrder = async (id: number) => {
    await apiClient.delete(`/orders/${id}`);
};

// Helper function to convert status string to enum value
const convertStatusToEnum = (status: Order['status']): number => {
    const statusMap: Record<Order['status'], number> = {
        'Pending': 0,
        'Processing': 1,
        'Shipped': 2,
        'Delivered': 3,
        'Cancelled': 4
    };
    return statusMap[status];
};

/**
 * Checks if the database connection is working
 * @returns Promise that resolves when the connection is successful
 * @throws Error when the connection fails
 */
export const checkDatabaseConnection = async () => {
    try {
        // Try to fetch a single product to verify database connection
        await apiClient.get('/health');
        return true;
    } catch (error) {
        console.error('Database connection check failed:', error);
        throw new Error('Could not connect to the database. Please try again later.');
    }
};