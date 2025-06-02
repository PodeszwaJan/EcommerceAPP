import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box, Paper, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import DatabaseCheck from './components/DatabaseCheck';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f5f5f5',
        },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
            },
        },
    },
});

const NavButton: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);
    
    return (
        <Button
            color="inherit"
            component={Link}
            to={to}
            sx={{
                mx: 1,
                px: 2,
                borderRadius: 2,
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
            }}
        >
            {children}
        </Button>
    );
};

/**
 * Main layout component that includes the navigation bar
 */
const MainLayout: React.FC = () => {
    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            width: '100vw',
            overflow: 'hidden'
        }}>
            <AppBar position="fixed" elevation={0}>
                <Toolbar>
                    <Typography
                        variant="h5"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 'bold',
                            letterSpacing: 1,
                        }}
                    >
                        E-Commerce Admin
                    </Typography>
                    <NavButton to="/products">
                        <InventoryIcon />
                        Products
                    </NavButton>
                    <NavButton to="/orders">
                        <ShoppingCartIcon />
                        Orders
                    </NavButton>
                </Toolbar>
            </AppBar>
            <Box component="main" sx={{ 
                flexGrow: 1, 
                pt: '64px', // height of AppBar
                pb: 4,
                px: 3,
                height: '100vh',
                overflow: 'auto'
            }}>
                <Container maxWidth="xl" sx={{ height: '100%' }}>
                    <Paper elevation={0} sx={{ 
                        p: 3, 
                        borderRadius: 2,
                        height: '100%',
                        backgroundColor: 'transparent'
                    }}>
                        <Routes>
                            <Route path="/products/*" element={<ProductsPage />} />
                            <Route path="/orders/*" element={<OrdersPage />} />
                            <Route path="/" element={<ProductsPage />} />
                        </Routes>
                    </Paper>
                </Container>
            </Box>
        </Box>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route element={<DatabaseCheck />}>
                        <Route path="/*" element={<MainLayout />} />
                    </Route>
                </Routes>
            </Router>
        </ThemeProvider>
    );
};

export default App;