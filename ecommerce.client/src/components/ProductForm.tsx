import React, { useState, useEffect } from 'react';
import { type Product } from '../api/models';
import { getProduct, createProduct, updateProduct } from '../api/apiClient';
import { Button, TextField, Box, Typography, Paper, Alert, Snackbar, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * ProductForm Component
 * Handles both creation and editing of products.
 * Provides form validation, error handling, and success feedback.
 * Uses Material-UI components for consistent styling and user experience.
 */
const ProductForm: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    
    // Initialize form state with empty product data
    const [product, setProduct] = useState<Omit<Product, 'id'> | Product>({
        name: '',
        description: '',
        price: 0,
        stockQuantity: 0,
    });
    
    // UI state management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Load existing product data if in edit mode
    useEffect(() => {
        if (id) {
            fetchProduct(parseInt(id));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    /**
     * Fetches product data from the API when editing an existing product
     * @param productId - The ID of the product to fetch
     */
    const fetchProduct = async (productId: number) => {
        try {
            setLoading(true);
            setError(null);
            const fetchedProduct = await getProduct(productId);
            console.log('Fetched product:', fetchedProduct);
            setProduct(fetchedProduct);
        } catch (error) {
            console.error('Error fetching product:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to fetch product');
            }
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Validates form input fields
     * Checks for required fields and valid numeric values
     * @returns {boolean} True if validation passes, false otherwise
     */
    const validateForm = () => {
        const errors: Record<string, string> = {};
        
        if (!product.name.trim()) {
            errors.name = 'Product name is required';
        }
        
        if (product.price <= 0) {
            errors.price = 'Price must be greater than 0';
        }
        
        if (product.stockQuantity < 0) {
            errors.stockQuantity = 'Stock quantity cannot be negative';
        }

        if (isNaN(product.price)) {
            errors.price = 'Price must be a valid number';
        }

        if (isNaN(product.stockQuantity)) {
            errors.stockQuantity = 'Stock quantity must be a valid number';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Handles form input changes
     * Includes special handling for numeric fields (price and stock quantity)
     * @param e - The change event from the input field
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let parsedValue = value;

        // Handle numeric fields
        if (name === 'price' || name === 'stockQuantity') {
            parsedValue = value === '' ? '0' : value;
            const num = parseFloat(value);
            if (isNaN(num)) {
                setValidationErrors({
                    ...validationErrors,
                    [name]: 'Must be a valid number'
                });
                return;
            }
        }

        setProduct({
            ...product,
            [name]: parsedValue
        });

        // Clear validation error when field is modified
        if (validationErrors[name]) {
            setValidationErrors({
                ...validationErrors,
                [name]: ''
            });
        }
    };

    /**
     * Handles form submission
     * Validates input, formats data, and sends to the API
     * Shows success/error messages and redirects on completion
     * @param e - The form submission event
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setError('Please fix the validation errors before submitting');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Format and sanitize product data
            const productData = {
                name: product.name.trim(),
                description: product.description.trim(),
                price: Math.max(0, Number(product.price)),
                stockQuantity: Math.max(0, Math.floor(Number(product.stockQuantity)))
            };

            // Handle update or create based on whether we have an ID
            if ('id' in product) {
                console.log('Updating product:', {
                    id: product.id,
                    currentData: product,
                    newData: productData
                });
                
                await updateProduct(product.id, {
                    ...productData,
                    id: product.id
                });
                setSuccess('Product updated successfully');
            } else {
                await createProduct(productData);
                setSuccess('Product created successfully');
            }
            setTimeout(() => navigate('/products'), 1500);
        } catch (error) {
            console.error('Form submission error:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to save product. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Show loading spinner while fetching product data
    if (loading && !product.name) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 600, margin: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                {id ? 'Edit Product' : 'Add Product'}
            </Typography>

            {/* Main form container */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    {/* Product name field */}
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Name"
                        name="name"
                        value={product.name}
                        onChange={handleChange}
                        required
                        error={!!validationErrors.name}
                        helperText={validationErrors.name}
                    />
                    
                    {/* Product description field */}
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Description"
                        name="description"
                        value={product.description}
                        onChange={handleChange}
                        multiline
                        rows={4}
                    />
                    
                    {/* Price and stock quantity fields */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <TextField
                            label="Price"
                            name="price"
                            type="number"
                            value={product.price}
                            onChange={handleChange}
                            required
                            error={!!validationErrors.price}
                            helperText={validationErrors.price}
                            InputProps={{
                                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                                inputProps: {
                                    min: 0.01,
                                    step: 0.01
                                }
                            }}
                            sx={{ width: 200 }}
                        />
                        <TextField
                            label="Stock Quantity"
                            name="stockQuantity"
                            type="number"
                            value={product.stockQuantity}
                            onChange={handleChange}
                            required
                            error={!!validationErrors.stockQuantity}
                            helperText={validationErrors.stockQuantity}
                            inputProps={{
                                min: 0
                            }}
                            sx={{ width: 200 }}
                        />
                    </Box>

                    {/* Form action buttons */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/products')}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : id ? 'Update Product' : 'Create Product'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Error notification */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>

            {/* Success notification */}
            <Snackbar
                open={!!success}
                autoHideDuration={1500}
                onClose={() => setSuccess(null)}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProductForm;