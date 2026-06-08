from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import (
    Sum, Count, Avg, Q, F, Value
)
from django.db.models.functions import TruncMonth, TruncDay, Coalesce
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal

from .models import (
    Category, Supplier, Product, Customer,
    Purchase, PurchaseItem, Sale, SaleItem, StockAdjustment
)
from .serializers import (
    UserSerializer, UserCreateSerializer, ChangePasswordSerializer,
    CategorySerializer, SupplierSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer,
    CustomerSerializer,
    PurchaseSerializer, PurchaseListSerializer,
    SaleSerializer, SaleListSerializer,
    StockAdjustmentSerializer,
)

User = get_user_model()


# ─── Auth Views ──────────────────────────────────────────────────────────────

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


# ─── Profile ─────────────────────────────────────────────────────────────────

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'old_password': 'Incorrect password.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'detail': 'Password updated successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── User Management ─────────────────────────────────────────────────────────

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'update', 'partial_update'):
            return [permissions.IsAdminUser()]
        return super().get_permissions()


# ─── Category ViewSet ────────────────────────────────────────────────────────

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


# ─── Supplier ViewSet ────────────────────────────────────────────────────────

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search))
        return qs


# ─── Product ViewSet ─────────────────────────────────────────────────────────

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('category', 'supplier')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        status_filter = self.request.query_params.get('status')
        low_stock = self.request.query_params.get('low_stock')

        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(brand__icontains=search)
            )
        if category:
            qs = qs.filter(category_id=category)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if low_stock == 'true':
            qs = qs.filter(quantity_in_stock__lte=F('reorder_level'))

        return qs

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        qs = self.get_queryset().filter(quantity_in_stock__lte=F('reorder_level'))
        serializer = ProductListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        qs = self.get_queryset().filter(quantity_in_stock=0)
        serializer = ProductListSerializer(qs, many=True)
        return Response(serializer.data)


# ─── Customer ViewSet ────────────────────────────────────────────────────────

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True)
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search)
            )
        return qs


# ─── Purchase ViewSet ────────────────────────────────────────────────────────

class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all().select_related('supplier', 'created_by')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseListSerializer
        return PurchaseSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        supplier = self.request.query_params.get('supplier')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if supplier:
            qs = qs.filter(supplier_id=supplier)
        return qs


# ─── Sale ViewSet ────────────────────────────────────────────────────────────

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().select_related('customer', 'sold_by')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return SaleListSerializer
        return SaleSerializer

    def perform_create(self, serializer):
        serializer.save(sold_by=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        payment = self.request.query_params.get('payment_method')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if payment:
            qs = qs.filter(payment_method=payment)
        if date_from:
            qs = qs.filter(sale_date__gte=date_from)
        if date_to:
            qs = qs.filter(sale_date__lte=date_to)
        return qs


# ─── Stock Adjustment ViewSet ────────────────────────────────────────────────

class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.all().select_related('product', 'adjusted_by')
    serializer_class = StockAdjustmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']  # No update/delete

    def perform_create(self, serializer):
        serializer.save(adjusted_by=self.request.user)


# ─── Reports Views ───────────────────────────────────────────────────────────

class DashboardReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = date.today()
        month_start = today.replace(day=1)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        last_month_end = month_start - timedelta(days=1)

        # This month totals
        this_month_sales = Sale.objects.filter(
            sale_date__gte=month_start,
            status='completed'
        ).aggregate(
            total=Coalesce(Sum('total_amount'), Decimal('0')),
            count=Count('id')
        )

        # Last month totals
        last_month_sales = Sale.objects.filter(
            sale_date__gte=last_month_start,
            sale_date__lte=last_month_end,
            status='completed'
        ).aggregate(
            total=Coalesce(Sum('total_amount'), Decimal('0'))
        )

        # Purchases this month
        this_month_purchases = Purchase.objects.filter(
            purchase_date__gte=month_start,
            status='received'
        ).aggregate(
            total=Coalesce(Sum('total_amount'), Decimal('0'))
        )

        # Product stats
        total_products = Product.objects.filter(is_active=True).count()
        low_stock_count = Product.objects.filter(
            is_active=True,
            quantity_in_stock__lte=F('reorder_level')
        ).count()
        out_of_stock_count = Product.objects.filter(
            is_active=True, quantity_in_stock=0
        ).count()

        # Monthly sales change %
        prev = float(last_month_sales['total'] or 0)
        curr = float(this_month_sales['total'] or 0)
        sales_change = round(((curr - prev) / prev * 100) if prev else 0, 1)

        # Revenue this year by month
        monthly = Sale.objects.filter(
            sale_date__year=today.year,
            status='completed'
        ).annotate(
            month=TruncMonth('sale_date')
        ).values('month').annotate(
            revenue=Sum('total_amount'),
            orders=Count('id')
        ).order_by('month')

        # Top products
        top_products = SaleItem.objects.filter(
            sale__status='completed',
            sale__sale_date__gte=month_start
        ).values(
            'product__name', 'product__sku'
        ).annotate(
            units_sold=Sum('quantity'),
            revenue=Sum(F('quantity') * F('unit_price'))
        ).order_by('-revenue')[:5]

        # Recent sales
        recent_sales = Sale.objects.filter(
            status='completed'
        ).select_related('customer', 'sold_by').order_by('-created_at')[:5]

        from .serializers import SaleListSerializer
        recent_sales_data = SaleListSerializer(recent_sales, many=True).data

        return Response({
            'summary': {
                'total_sales_this_month': float(this_month_sales['total']),
                'sales_orders_this_month': this_month_sales['count'],
                'sales_change_pct': sales_change,
                'total_purchases_this_month': float(this_month_purchases['total']),
                'total_products': total_products,
                'low_stock_count': low_stock_count,
                'out_of_stock_count': out_of_stock_count,
            },
            'monthly_revenue': [
                {
                    'month': m['month'].strftime('%b'),
                    'revenue': float(m['revenue']),
                    'orders': m['orders']
                }
                for m in monthly
            ],
            'top_products': [
                {
                    'name': p['product__name'],
                    'sku': p['product__sku'],
                    'units_sold': p['units_sold'],
                    'revenue': float(p['revenue'])
                }
                for p in top_products
            ],
            'recent_sales': recent_sales_data,
        })


class SalesTrendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'monthly')  # daily | monthly
        year = int(request.query_params.get('year', date.today().year))

        if period == 'daily':
            days = 30
            since = date.today() - timedelta(days=days)
            data = Sale.objects.filter(
                sale_date__gte=since, status='completed'
            ).annotate(
                period=TruncDay('sale_date')
            ).values('period').annotate(
                revenue=Sum('total_amount'),
                orders=Count('id')
            ).order_by('period')
        else:
            data = Sale.objects.filter(
                sale_date__year=year, status='completed'
            ).annotate(
                period=TruncMonth('sale_date')
            ).values('period').annotate(
                revenue=Sum('total_amount'),
                orders=Count('id')
            ).order_by('period')

        purchases = Purchase.objects.filter(
            purchase_date__year=year, status='received'
        ).annotate(
            period=TruncMonth('purchase_date')
        ).values('period').annotate(
            cost=Sum('total_amount')
        ).order_by('period')

        purchase_map = {p['period']: float(p['cost']) for p in purchases}

        return Response({
            'period': period,
            'year': year,
            'data': [
                {
                    'label': d['period'].strftime('%b %Y' if period == 'monthly' else '%d %b'),
                    'revenue': float(d['revenue']),
                    'orders': d['orders'],
                    'purchases': purchase_map.get(d['period'], 0)
                }
                for d in data
            ]
        })


class TopProductsReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = SaleItem.objects.filter(sale__status='completed')
        if date_from:
            qs = qs.filter(sale__sale_date__gte=date_from)
        if date_to:
            qs = qs.filter(sale__sale_date__lte=date_to)

        top = qs.values(
            'product__id', 'product__name', 'product__sku',
            'product__category__name'
        ).annotate(
            units_sold=Sum('quantity'),
            revenue=Sum(F('quantity') * F('unit_price')),
            profit=Sum(F('quantity') * (F('unit_price') - F('unit_cost')))
        ).order_by('-revenue')[:limit]

        return Response([
            {
                'product_id': p['product__id'],
                'name': p['product__name'],
                'sku': p['product__sku'],
                'category': p['product__category__name'],
                'units_sold': p['units_sold'],
                'revenue': float(p['revenue']),
                'profit': float(p['profit'])
            }
            for p in top
        ])


class LowStockReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(
            is_active=True,
            quantity_in_stock__lte=F('reorder_level')
        ).select_related('category', 'supplier').order_by('quantity_in_stock')

        from .serializers import ProductListSerializer
        return Response(ProductListSerializer(products, many=True).data)