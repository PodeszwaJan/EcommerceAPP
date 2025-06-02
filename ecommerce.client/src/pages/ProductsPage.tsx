import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';

/**
 * ProductsPage Component
 * Handles routing for product-related views:
 * - Product list view (/)
 * - Create new product form (/new)
 * - Edit existing product form (/:id)
 */
const ProductsPage: React.FC = () => {
    return (
        <Routes>
            {/* Display list of all products */}
            <Route path="/" element={<ProductList />} />
            {/* Form for creating a new product */}
            <Route path="/new" element={<ProductForm />} />
            {/* Form for editing an existing product */}
            <Route path="/:id" element={<ProductForm />} />
        </Routes>
    );
};

export default ProductsPage;