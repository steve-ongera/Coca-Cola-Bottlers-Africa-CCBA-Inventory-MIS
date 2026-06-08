from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    LogoutView, ProfileView, ChangePasswordView,
    UserViewSet, CategoryViewSet, SupplierViewSet,
    ProductViewSet, CustomerViewSet, PurchaseViewSet,
    SaleViewSet, StockAdjustmentViewSet,
    DashboardReportView, SalesTrendView,
    TopProductsReportView, LowStockReportView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'suppliers', SupplierViewSet, basename='suppliers')
router.register(r'products', ProductViewSet, basename='products')
router.register(r'customers', CustomerViewSet, basename='customers')
router.register(r'purchases', PurchaseViewSet, basename='purchases')
router.register(r'sales', SaleViewSet, basename='sales')
router.register(r'adjustments', StockAdjustmentViewSet, basename='adjustments')

urlpatterns = [
    # Auth
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Reports
    path('reports/dashboard/', DashboardReportView.as_view(), name='report-dashboard'),
    path('reports/sales-trend/', SalesTrendView.as_view(), name='report-sales-trend'),
    path('reports/top-products/', TopProductsReportView.as_view(), name='report-top-products'),
    path('reports/low-stock/', LowStockReportView.as_view(), name='report-low-stock'),

    # ViewSet routes
    path('', include(router.urls)),
]