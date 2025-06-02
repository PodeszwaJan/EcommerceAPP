export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
}

export interface OrderItem {
    productId: number;
    quantity: number;
    unitPrice: number;
    product?: Product;
}

export interface Order {
    id: number;
    customerName: string;
    customerEmail: string;
    shippingAddress: string;
    orderDate: string;
    status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    orderItems: OrderItem[];
}