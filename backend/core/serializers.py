from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Category, Supplier, Product, Customer,
    Purchase, PurchaseItem, Sale, SaleItem, StockAdjustment
)

User = get_user_model()


# ─── Auth / User ────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'phone', 'department', 'avatar',
            'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'confirm_password', 'role', 'phone', 'department'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs


# ─── Category ───────────────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'slug', 'is_active', 'product_count', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']


# ─── Supplier ───────────────────────────────────────────────────────────────

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


# ─── Product ────────────────────────────────────────────────────────────────

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'category', 'category_name',
            'supplier', 'supplier_name', 'brand', 'unit',
            'buying_price', 'selling_price', 'quantity_in_stock',
            'reorder_level', 'image', 'status', 'is_active',
            'is_low_stock', 'is_out_of_stock', 'profit_margin',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductDetailSerializer(ProductListSerializer):
    class Meta(ProductListSerializer.Meta):
        pass


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'sku', 'name', 'description', 'category', 'supplier',
            'brand', 'unit', 'buying_price', 'selling_price',
            'quantity_in_stock', 'reorder_level', 'image', 'status'
        ]

    def validate_sku(self, value):
        qs = Product.objects.filter(sku=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A product with this SKU already exists.')
        return value

    def validate(self, attrs):
        if attrs.get('selling_price', 0) < attrs.get('buying_price', 0):
            raise serializers.ValidationError(
                'Selling price cannot be less than buying price.'
            )
        return attrs


# ─── Customer ───────────────────────────────────────────────────────────────

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


# ─── Purchase ───────────────────────────────────────────────────────────────

class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = PurchaseItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_cost', 'subtotal']


class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Purchase
        fields = [
            'id', 'reference', 'supplier', 'supplier_name',
            'created_by', 'created_by_name', 'status', 'total_amount',
            'notes', 'purchase_date', 'received_date', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_amount', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        purchase = Purchase.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseItem.objects.create(purchase=purchase, **item_data)
            if purchase.status == 'received':
                product = item_data['product']
                product.quantity_in_stock += item_data['quantity']
                product.save(update_fields=['quantity_in_stock'])
        purchase.calculate_total()
        return purchase


class PurchaseListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Purchase
        fields = [
            'id', 'reference', 'supplier_name', 'status',
            'total_amount', 'purchase_date', 'item_count', 'created_at'
        ]

    def get_item_count(self, obj):
        return obj.items.count()


# ─── Sale ────────────────────────────────────────────────────────────────────

class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'unit_cost', 'discount', 'subtotal'
        ]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    sold_by_name = serializers.CharField(source='sold_by.full_name', read_only=True)
    profit = serializers.ReadOnlyField()

    class Meta:
        model = Sale
        fields = [
            'id', 'reference', 'customer', 'customer_name',
            'sold_by', 'sold_by_name', 'status', 'payment_method',
            'subtotal', 'discount', 'tax', 'total_amount', 'profit',
            'notes', 'sale_date', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'subtotal', 'total_amount', 'created_at', 'updated_at']

    def validate(self, attrs):
        items_data = attrs.get('items', [])
        if not items_data:
            raise serializers.ValidationError({'items': 'A sale must have at least one item.'})
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        sale = Sale.objects.create(**validated_data)
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            if product.quantity_in_stock < quantity:
                raise serializers.ValidationError(
                    f'Insufficient stock for {product.name}. '
                    f'Available: {product.quantity_in_stock}'
                )
            item_data.setdefault('unit_cost', product.buying_price)
            SaleItem.objects.create(sale=sale, **item_data)
            product.quantity_in_stock -= quantity
            product.save(update_fields=['quantity_in_stock'])
        sale.calculate_totals()
        return sale


class SaleListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    sold_by_name = serializers.CharField(source='sold_by.full_name', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            'id', 'reference', 'customer_name', 'sold_by_name',
            'status', 'payment_method', 'total_amount',
            'sale_date', 'item_count', 'created_at'
        ]

    def get_item_count(self, obj):
        return obj.items.count()


# ─── Stock Adjustment ────────────────────────────────────────────────────────

class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    adjusted_by_name = serializers.CharField(source='adjusted_by.full_name', read_only=True)

    class Meta:
        model = StockAdjustment
        fields = [
            'id', 'product', 'product_name', 'adjusted_by', 'adjusted_by_name',
            'adjustment_type', 'quantity', 'quantity_before', 'quantity_after',
            'reason', 'reference', 'created_at'
        ]
        read_only_fields = ['id', 'quantity_before', 'quantity_after', 'created_at']

    def create(self, validated_data):
        product = validated_data['product']
        qty = validated_data['quantity']
        adj_type = validated_data['adjustment_type']

        validated_data['quantity_before'] = product.quantity_in_stock

        if adj_type in ('deduction', 'damage'):
            product.quantity_in_stock = max(0, product.quantity_in_stock - abs(qty))
        else:
            product.quantity_in_stock += abs(qty)

        validated_data['quantity_after'] = product.quantity_in_stock
        product.save(update_fields=['quantity_in_stock'])
        return super().create(validated_data)