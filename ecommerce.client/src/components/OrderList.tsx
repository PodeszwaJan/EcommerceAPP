import React, { useEffect, useState } from 'react';
import { type Order } from '../api/models';
import { getOrders, deleteOrder } from '../api/apiClient';
import { 
    Button, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    IconButton, 
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    Typography,
    InputAdornment,
    Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';

/**
 * OrderList Component
 * Displays a table of all orders with options to create, edit, delete, and view orders.
 * Includes search functionality and detailed order view.
 */
const OrderList: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const navigate = useNavigate();

    // Load orders when component mounts
    useEffect(() => {
        fetchOrders();
    }, []);

    // Filter orders when search term changes
    useEffect(() => {
        const filtered = orders.filter(order => 
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.shippingAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toString().includes(searchTerm)
        );
        setFilteredOrders(filtered);
    }, [searchTerm, orders]);

    /**
     * Fetches the current list of orders from the API
     * and updates the component state
     */
    const fetchOrders = async () => {
        const orders = await getOrders();
        setOrders(orders);
        setFilteredOrders(orders);
    };

    /**
     * Handles order deletion
     * @param id - The ID of the order to delete
     */
    const handleDelete = async (id: number) => {
        await deleteOrder(id);
        fetchOrders(); // Refresh the order list after deletion
    };

    /**
     * Opens the order details dialog
     * @param order - The order to view
     */
    const handleView = (order: Order) => {
        setSelectedOrder(order);
    };

    /**
     * Closes the order details dialog
     */
    const handleCloseDialog = () => {
        setSelectedOrder(null);
    };

    /**
     * Maps order status to Material-UI Chip colors
     * @param status - The order status string
     * @returns The corresponding Material-UI color for the status chip
     */
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'default';
            case 'Processing': return 'primary';
            case 'Shipped': return 'info';
            case 'Delivered': return 'success';
            case 'Cancelled': return 'error';
            default: return 'default';
        }
    };

    /**
     * Formats a date string to localized date-time format
     * @param dateString - ISO date string to format
     * @returns Formatted date string in Polish locale
     */
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    /**
     * Calculates the total amount for an order
     * @param order - The order to calculate total for
     * @returns The total amount formatted as currency
     */
    const calculateTotal = (order: Order) => {
        return order.orderItems.reduce((sum, item) => 
            sum + (item.unitPrice * item.quantity), 0).toFixed(2);
    };

    return (
        <div>
            {/* Search and Create Order section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TextField
                    placeholder="Search orders..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 300 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => navigate('/orders/new')}
                >
                    Create Order
                </Button>
            </Box>

            {/* Orders table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Items</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>{order.id}</TableCell>
                                <TableCell>{order.customerName}</TableCell>
                                <TableCell>{order.customerEmail}</TableCell>
                                <TableCell>{formatDateTime(order.orderDate)}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={order.status} 
                                        color={getStatusColor(order.status)} 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell>{order.orderItems.length}</TableCell>
                                <TableCell>${calculateTotal(order)}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleView(order)} title="View details">
                                        <VisibilityIcon />
                                    </IconButton>
                                    <IconButton onClick={() => navigate(`/orders/${order.id}`)} title="Edit">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(order.id)} title="Delete">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Order Details Dialog */}
            <Dialog 
                open={!!selectedOrder} 
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Order Details</DialogTitle>
                <DialogContent>
                    {selectedOrder && (
                        <Box sx={{ pt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                        Order Information
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Order ID:</strong> {selectedOrder.id}
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Date:</strong> {formatDateTime(selectedOrder.orderDate)}
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Status:</strong>{' '}
                                        <Chip 
                                            label={selectedOrder.status} 
                                            color={getStatusColor(selectedOrder.status)} 
                                            size="small" 
                                        />
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                        Customer Information
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Name:</strong> {selectedOrder.customerName}
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Email:</strong> {selectedOrder.customerEmail}
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        <strong>Shipping Address:</strong> {selectedOrder.shippingAddress}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom>
                                        Order Items
                                    </Typography>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Product ID</TableCell>
                                                    <TableCell>Quantity</TableCell>
                                                    <TableCell>Unit Price</TableCell>
                                                    <TableCell>Total</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedOrder.orderItems.map((item) => (
                                                    <TableRow key={item.productId}>
                                                        <TableCell>{item.productId}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            ${(item.quantity * item.unitPrice).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell colSpan={3} align="right">
                                                        <strong>Total:</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>${calculateTotal(selectedOrder)}</strong>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                    {selectedOrder && (
                        <Button 
                            onClick={() => navigate(`/orders/${selectedOrder.id}`)}
                            color="primary"
                        >
                            Edit
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default OrderList;