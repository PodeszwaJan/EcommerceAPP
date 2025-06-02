import React, { useEffect, useState } from 'react';
import { type Product } from '../api/models';
import { getProducts, deleteProduct } from '../api/apiClient';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    Typography,
    InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';

/**
 * ProductList Component
 * Displays a table of all products with options to add, edit, delete, and view products.
 * Includes search functionality and detailed product view.
 */
const ProductList: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const navigate = useNavigate();

    // Load products when component mounts
    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter products when search term changes
    useEffect(() => {
        const filtered = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.price.toString().includes(searchTerm) ||
            product.stockQuantity.toString().includes(searchTerm)
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    /**
     * Fetches the current list of products from the API
     * and updates the component state
     */
    const fetchProducts = async () => {
        const products = await getProducts();
        setProducts(products);
        setFilteredProducts(products);
    };

    /**
     * Handles product deletion
     * @param id - The ID of the product to delete
     */
    const handleDelete = async (id: number) => {
        await deleteProduct(id);
        fetchProducts(); // Refresh the product list after deletion
    };

    /**
     * Opens the product details dialog
     * @param product - The product to view
     */
    const handleView = (product: Product) => {
        setSelectedProduct(product);
    };

    /**
     * Closes the product details dialog
     */
    const handleCloseDialog = () => {
        setSelectedProduct(null);
    };

    return (
        <div>
            {/* Search and Add Product section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TextField
                    placeholder="Search products..."
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
                    onClick={() => navigate('/products/new')}
                >
                    Add Product
                </Button>
            </Box>

            {/* Products table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Stock</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.id}</TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.description}</TableCell>
                                <TableCell>${product.price.toFixed(2)}</TableCell>
                                <TableCell>{product.stockQuantity}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleView(product)} title="View details">
                                        <VisibilityIcon />
                                    </IconButton>
                                    <IconButton onClick={() => navigate(`/products/${product.id}`)} title="Edit">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(product.id)} title="Delete">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Product Details Dialog */}
            <Dialog 
                open={!!selectedProduct} 
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Product Details</DialogTitle>
                <DialogContent>
                    {selectedProduct && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {selectedProduct.name}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>ID:</strong> {selectedProduct.id}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Description:</strong> {selectedProduct.description}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Price:</strong> ${selectedProduct.price.toFixed(2)}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Stock Quantity:</strong> {selectedProduct.stockQuantity}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                    {selectedProduct && (
                        <Button 
                            onClick={() => navigate(`/products/${selectedProduct.id}`)}
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

export default ProductList;