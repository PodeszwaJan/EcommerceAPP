import React, { useState, useEffect } from 'react';
import { type Order, type Product } from '../api/models';
import { getOrder, createOrder, updateOrder, getProducts } from '../api/apiClient';
import {
    Button, TextField, Box, Typography, Select, MenuItem, FormControl,
    InputLabel, Table, TableBody, TableCell, TableHead, TableRow,
    IconButton, Paper, TableContainer, Alert, Snackbar, CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { type SelectChangeEvent } from '@mui/material';

const OrderForm: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Omit<Order, 'id' | 'orderDate'> | Order>({
        customerName: '',
        customerEmail: '',
        shippingAddress: '',
        status: 'Pending',
        orderItems: [],
    });
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchProducts();
        if (id) {
            fetchOrder(parseInt(id));
        }
    }, [id]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const fetchedProducts = await getProducts();
            setProducts(fetchedProducts);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrder = async (orderId: number) => {
        try {
            setLoading(true);
            const fetchedOrder = await getOrder(orderId);
            setOrder(fetchedOrder);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch order');
            navigate('/orders');
        } finally {
            setLoading(false);
        }
    };




    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!order.customerName.trim()) errors.customerName = 'Customer name is required';
        if (!order.customerEmail.trim()) {
            errors.customerEmail = 'Customer email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customerEmail)) {
            errors.customerEmail = 'Invalid email format';
        }

        if (!order.shippingAddress.trim()) errors.shippingAddress = 'Shipping address is required';
        if (order.orderItems.length === 0) errors.orderItems = 'At least one product must be added';

        products.forEach(product => {
            if (product.stockQuantity < 0) {
                errors[`product_${product.id}_stock`] = `Product "${product.name}" has invalid stock quantity`;
            }
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };



    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setOrder(prev => ({
            ...prev,
            [name]: value,
        }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleStatusChange = (e: SelectChangeEvent<Order['status']>) => {
        setOrder(prev => ({
            ...prev,
            status: e.target.value as Order['status'],
        }));
    };

    const handleAddItem = () => {
        if (!selectedProductId || quantity <= 0) {
            setError('Please select a product and enter a valid quantity');
            return;
        }

        const productIndex = products.findIndex(p => p.id === selectedProductId);
        if (productIndex === -1) {
            setError('Selected product not found');
            return;
        }

        const product = products[productIndex];

        if (quantity > product.stockQuantity) {
            setError(`Cannot add ${quantity} units. Only ${product.stockQuantity} available in stock.`);
            return;
        }

        // update orderItems
        const existingItem = order.orderItems.find(item => item.productId === selectedProductId);
        if (existingItem) {
            const updatedItems = order.orderItems.map(item =>
                item.productId === selectedProductId
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            );
            setOrder(prev => ({
                ...prev,
                orderItems: updatedItems,
            }));
        } else {
            setOrder(prev => ({
                ...prev,
                orderItems: [
                    ...prev.orderItems,
                    {
                        productId: selectedProductId,
                        quantity,
                        unitPrice: product.price,
                    },
                ],
            }));
        }

        // decrease stockQuantity in products
        const updatedProducts = [...products];
        updatedProducts[productIndex] = {
            ...product,
            stockQuantity: product.stockQuantity - quantity,
        };
        setProducts(updatedProducts);

        setSelectedProductId('');
        setQuantity(1);
        if (validationErrors.orderItems) {
            setValidationErrors(prev => ({
                ...prev,
                orderItems: '',
            }));
        }
        setError(null);
    };


    const handleRemoveItem = (productId: number) => {
        const itemToRemove = order.orderItems.find(item => item.productId === productId);
        if (!itemToRemove) return;

        // increase stockQuantity in products
        const productIndex = products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            const updatedProducts = [...products];
            updatedProducts[productIndex] = {
                ...updatedProducts[productIndex],
                stockQuantity: updatedProducts[productIndex].stockQuantity + itemToRemove.quantity,
            };
            setProducts(updatedProducts);
        }

        // remove product from orderItems
        setOrder(prev => ({
            ...prev,
            orderItems: prev.orderItems.filter(item => item.productId !== productId),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            setError('Please fix the validation errors before submitting');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const orderData = {
                customerName: order.customerName.trim(),
                customerEmail: order.customerEmail.trim(),
                shippingAddress: order.shippingAddress.trim(),
                status: order.status,
                orderItems: order.orderItems.map(item => ({
                    productId: item.productId,
                    quantity: Math.max(1, Math.floor(Number(item.quantity))),
                    unitPrice: parseFloat(item.unitPrice.toString())
                }))
            };

            if ('id' in order) {
                await updateOrder(order.id, { ...orderData, id: order.id });
                setSuccess('Order updated successfully');
            } else {
                await createOrder(orderData);
                setSuccess('Order created successfully');
            }
            setTimeout(() => navigate('/orders'), 1500);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to save order');
        } finally {
            setLoading(false);
        }
    };

    const getProductName = (productId: number) => {
        const product = products.find(p => p.id === productId);
        return product ? product.name : 'Unknown Product';
    };

    const calculateTotal = () => {
        return order.orderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    };

    if (loading && !order.customerName) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, margin: 'auto', p: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                {id ? 'Edit Order' : 'Create Order'}
            </Typography>

            <Paper elevation={2} sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth margin="normal" label="Customer Name" name="customerName"
                        value={order.customerName} onChange={handleChange}
                        required error={!!validationErrors.customerName}
                        helperText={validationErrors.customerName}
                    />
                    <TextField
                        fullWidth margin="normal" label="Customer Email" name="customerEmail" type="email"
                        value={order.customerEmail} onChange={handleChange}
                        required error={!!validationErrors.customerEmail}
                        helperText={validationErrors.customerEmail}
                    />
                    <TextField
                        fullWidth margin="normal" label="Shipping Address" name="shippingAddress"
                        multiline rows={3} value={order.shippingAddress} onChange={handleChange}
                        required error={!!validationErrors.shippingAddress}
                        helperText={validationErrors.shippingAddress}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={order.status} label="Status" onChange={handleStatusChange}
                        >
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Processing">Processing</MenuItem>
                            <MenuItem value="Shipped">Shipped</MenuItem>
                            <MenuItem value="Delivered">Delivered</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ mt: 4, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Order Items
                        </Typography>
                        {validationErrors.orderItems && (
                            <Alert severity="error" sx={{ mb: 2 }}>{validationErrors.orderItems}</Alert>
                        )}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Product</InputLabel>
                                <Select
                                    value={selectedProductId}
                                    label="Product"
                                    onChange={(e) => setSelectedProductId(Number(e.target.value))}
                                >
                                    {products.map(product => (
                                        <MenuItem key={product.id} value={product.id}>
                                            {product.name} (${product.price}) - Stock: {product.stockQuantity}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Quantity" type="number" value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                inputProps={{ min: 1 }}
                                sx={{ width: 100 }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleAddItem}
                                startIcon={<AddShoppingCartIcon />}
                                disabled={!selectedProductId}
                            >
                                Add Item
                            </Button>
                        </Box>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell align="right">Unit Price</TableCell>
                                        <TableCell align="right">Quantity</TableCell>
                                        <TableCell align="right">Total</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {order.orderItems.map(item => (
                                        <TableRow key={item.productId}>
                                            <TableCell>{getProductName(item.productId)}</TableCell>
                                            <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                                            <TableCell align="right">{item.quantity}</TableCell>
                                            <TableCell align="right">${(item.unitPrice * item.quantity).toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    onClick={() => handleRemoveItem(item.productId)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={3} align="right">
                                            <strong>Total:</strong>
                                        </TableCell>
                                        <TableCell align="right">
                                            <strong>${calculateTotal().toFixed(2)}</strong>
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                        <Button variant="outlined" onClick={() => navigate('/orders')} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : id ? 'Update Order' : 'Create Order'}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Snackbar>

            <Snackbar open={!!success} autoHideDuration={1500} onClose={() => setSuccess(null)}>
                <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
            </Snackbar>
        </Box>
    );
};

export default OrderForm;
