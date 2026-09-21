import { environment } from "@env/environment";

export const API = {
  base: environment.apiBaseUrl,

  auth: {
    login: "/users/auth/login",
    register: "/users/auth/register",
    refresh: "/users/auth/refresh",
    logout: "/users/auth/logout",
  },

  users: {
    root: "/users",
    byId: (id: string) => `/users/${id}`,
    widgetbyId: (id: string) => `/users/widget/${id}`,
    count: "/users/count",
  },

  products: {
    root: "/products",
    bySeller: (userId: string) => `/products/user/${userId}`,
    byId: (id: string) => `/products/${id}`,
    count: "/products/count",
  },

  media: {
    images: "/media/images",
    byId: (id: string) => `/media/images/${id}`,
    byUser: (userId: string) => `/media/images/user/${userId}`,
    count: "/media/images/count",
    delete: (id: string) => `/media/images/${id}`,
  },
  profile: {
    me: "/users/me",
    avatar: "/users/me/avatar",
  },

  carts: {
    root: "/carts",
    item: (productId: string) => `/carts/items/${productId}`,
  },
} as const;
