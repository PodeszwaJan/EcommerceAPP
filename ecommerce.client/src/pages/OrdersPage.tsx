import React from 'react';
import { Routes, Route } from 'react-router-dom';
import OrderList from '../components/OrderList';
import OrderForm from '../components/OrderForm';

/**
 * OrdersPage Component
 * Handles routing for order-related views:
 * - Order list view (/)
 * - Create new order form (/new)
 * - Edit existing order form (/:id)
 */
const OrdersPage: React.FC = () => {
    return (
        <Routes>
            {/* Display list of all orders */}
            <Route path="/" element={<OrderList />} />
            {/* Form for creating a new order */}
            <Route path="/new" element={<OrderForm />} />
            {/* Form for editing an existing order */}
            <Route path="/:id" element={<OrderForm />} />
        </Routes>
    );
};

export default OrdersPage;