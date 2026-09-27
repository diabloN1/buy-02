export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
}

export interface AddToCartItem {
  productId: string;
  quantity: number;
}

export interface UpdateCartItem {
  quantity: number;
}
