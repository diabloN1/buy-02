import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { roleGuard } from "./core/guards/role.guard";

export const APP_ROUTES: Routes = [
  {
    path: "",
    pathMatch: "full",
    loadComponent: () =>
      import("./features/products/pages/home.page").then((m) => m.HomePage),
  },
  {
    path: "products",
    loadComponent: () =>
      import("./features/products/pages/product-list.page").then(
        (m) => m.ProductListPage
      ),
  },
  {
    path: "products/:id",
    loadComponent: () =>
      import("./features/products/pages/product-details.page").then(
        (m) => m.ProductDetailsPage
      ),
  },
  {
    path: "auth/login",
    loadComponent: () =>
      import("./features/auth/login/login.page").then((m) => m.LoginPage),
  },
  {
    path: "auth/register",
    loadComponent: () =>
      import("./features/auth/register/register.page").then(
        (m) => m.RegisterPage
      ),
  },

  {
    path: "dashboard",
    canActivate: [authGuard, roleGuard(["SELLER"])],
    loadComponent: () =>
      import(
        "./features/dashboard/seller-dashboard/seller-dashboard.page"
      ).then((m) => m.SellerDashboardPage),
  },
  {
    path: "admin/dashboard",
    canActivate: [authGuard, roleGuard(["ADMIN"])],
    loadComponent: () =>
      import("./features/dashboard/admin-dashboard/admin-dashboard.page").then(
        (m) => m.AdminDashboardPage
      ),
  },
  {
    path: "admin/products",
    canActivate: [authGuard, roleGuard(["ADMIN"])],
    loadComponent: () =>
      import("./features/admin/admin-products.page").then(
        (m) => m.AdminProductsPage
      ),
  },
  {
    path: "admin/products/:id/edit",
    canActivate: [authGuard, roleGuard(["ADMIN"])],
    loadComponent: () =>
      import("./features/products/pages/product-form.page").then(
        (m) => m.ProductFormPage
      ),
  },
  {
    path: "admin/users",
    canActivate: [authGuard, roleGuard(["ADMIN"])],
    loadComponent: () =>
      import("./features/admin/admin-users.page").then((m) => m.AdminUsersPage),
  },
  {
    path: "seller/products",
    canActivate: [authGuard, roleGuard(["SELLER"])],
    loadComponent: () =>
      import("./features/products/pages/seller-products.page").then(
        (m) => m.SellerProductsPage
      ),
  },
  {
    path: "seller/products/new",
    canActivate: [authGuard, roleGuard(["SELLER"])],
    loadComponent: () =>
      import("./features/products/pages/product-form.page").then(
        (m) => m.ProductFormPage
      ),
  },
  {
    path: "seller/products/:id/edit",
    canActivate: [authGuard, roleGuard(["SELLER", "ADMIN"])],
    loadComponent: () =>
      import("./features/products/pages/product-form.page").then(
        (m) => m.ProductFormPage
      ),
  },
  {
    path: "seller/media",
    canActivate: [authGuard, roleGuard(["SELLER", "ADMIN"])],
    loadComponent: () =>
      import("./features/media/media-management.page").then(
        (m) => m.MediaManagementPage
      ),
  },
  {
    path: "profile",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/profile/profile.page").then((m) => m.ProfilePage),
  },

  {
    path: "cart",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/cart/cart.page").then((m) => m.CartPage),
  },

  {
    path: "**",
    loadComponent: () =>
      import("./features/not-found/not-found.page").then((m) => m.NotFoundPage),
  },
];
