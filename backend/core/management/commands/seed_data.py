"""
Management command: seed_data
Generates ~1 year of realistic Coca-Cola Bottlers Africa (CCBA) inventory data.

Usage:
    python manage.py seed_data
    python manage.py seed_data --year 2025
    python manage.py seed_data --flush   # wipes existing data first
    python manage.py seed_data --flush --year 2025
"""

import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from core.models import (
    Category, Supplier, Product,
    Customer, Purchase, PurchaseItem,
    Sale, SaleItem, StockAdjustment,
)

User = get_user_model()


# ─── Static master data ──────────────────────────────────────────────────────

CATEGORIES = [
    ("Sparkling Beverages", "Carbonated soft drinks — Coca-Cola, Sprite, Fanta family"),
    ("Water & Hydration",   "Still and sparkling water products"),
    ("Juices & Nectars",    "100% juice, nectar blends and juice drinks"),
    ("Energy Drinks",       "Energy and sport drinks — Monster, Burn"),
    ("Dairy & Plant-Based", "Fairlife, Minute Maid dairy blends"),
    ("Teas & Coffees",      "Ready-to-drink teas and coffee beverages"),
    ("Syrups & Concentrates","Fountain syrups and bag-in-box concentrates"),
    ("Promotional & Mix",   "Multipacks, gift packs and bundled SKUs"),
]

SUPPLIERS = [
    {
        "name": "CCBA East Africa Distribution Ltd",
        "contact_person": "James Kariuki",
        "email": "jkariuki@ccba-ea.co.ke",
        "phone": "+254 722 100 001",
        "city": "Nairobi",
    },
    {
        "name": "Nairobi Bottlers Limited",
        "contact_person": "Grace Wambui",
        "email": "gwambui@nbl.co.ke",
        "phone": "+254 733 200 002",
        "city": "Nairobi",
    },
    {
        "name": "Rift Valley Beverages Co.",
        "contact_person": "Samuel Kiprotich",
        "email": "skiprotich@rvb.co.ke",
        "phone": "+254 700 300 003",
        "city": "Nakuru",
    },
    {
        "name": "Coast Beverages & Logistics",
        "contact_person": "Fatuma Hassan",
        "email": "fhassan@coastbev.co.ke",
        "phone": "+254 741 400 004",
        "city": "Mombasa",
    },
    {
        "name": "Highlands Drinks Distributors",
        "contact_person": "Peter Mwangi",
        "email": "pmwangi@highlandsdist.co.ke",
        "phone": "+254 712 500 005",
        "city": "Eldoret",
    },
]

# (name, brand, unit, buying_price, selling_price, reorder_level, category_index)
PRODUCTS = [
    # Sparkling (cat 0)
    ("Coca-Cola Classic 300ml",       "Coca-Cola", "pcs",   35.00,  55.00, 100, 0),
    ("Coca-Cola Classic 500ml",       "Coca-Cola", "pcs",   55.00,  80.00, 150, 0),
    ("Coca-Cola Classic 1.5L",        "Coca-Cola", "pcs",   90.00, 130.00,  80, 0),
    ("Coca-Cola Classic Crate 24×300","Coca-Cola", "crate", 800.00,1200.00,  30, 0),
    ("Coca-Cola Zero Sugar 300ml",    "Coca-Cola", "pcs",   38.00,  58.00,  60, 0),
    ("Coca-Cola Zero Sugar 500ml",    "Coca-Cola", "pcs",   58.00,  82.00,  60, 0),
    ("Sprite 300ml",                  "Sprite",    "pcs",   33.00,  52.00,  80, 0),
    ("Sprite 500ml",                  "Sprite",    "pcs",   52.00,  75.00, 100, 0),
    ("Sprite 1.5L",                   "Sprite",    "pcs",   88.00, 125.00,  50, 0),
    ("Fanta Orange 300ml",            "Fanta",     "pcs",   33.00,  52.00,  80, 0),
    ("Fanta Orange 500ml",            "Fanta",     "pcs",   52.00,  75.00,  80, 0),
    ("Fanta Pineapple 300ml",         "Fanta",     "pcs",   33.00,  52.00,  60, 0),
    ("Fanta Blackcurrant 300ml",      "Fanta",     "pcs",   33.00,  52.00,  40, 0),
    ("Krest Bitter Lemon 300ml",      "Krest",     "pcs",   35.00,  55.00,  40, 0),
    ("Schweppes Tonic Water 300ml",   "Schweppes", "pcs",   38.00,  60.00,  30, 0),
    ("Schweppes Ginger Ale 300ml",    "Schweppes", "pcs",   38.00,  60.00,  25, 0),
    # Water (cat 1)
    ("Dasani Still Water 300ml",      "Dasani",    "pcs",   20.00,  35.00, 200, 1),
    ("Dasani Still Water 500ml",      "Dasani",    "pcs",   30.00,  50.00, 250, 1),
    ("Dasani Still Water 1L",         "Dasani",    "pcs",   50.00,  80.00, 120, 1),
    ("Dasani Still Water 1.5L",       "Dasani",    "pcs",   65.00, 100.00, 100, 1),
    ("Dasani Sparkling Water 500ml",  "Dasani",    "pcs",   45.00,  70.00,  50, 1),
    ("Keringet Natural Water 1L",     "Keringet",  "pcs",   48.00,  75.00,  80, 1),
    ("Keringet Natural Water 1.5L",   "Keringet",  "pcs",   62.00,  95.00,  70, 1),
    # Juices (cat 2)
    ("Minute Maid Orange 300ml",      "Minute Maid","pcs",  55.00,  85.00,  60, 2),
    ("Minute Maid Orange 1L",         "Minute Maid","pcs", 110.00, 170.00,  40, 2),
    ("Minute Maid Mango 300ml",       "Minute Maid","pcs",  55.00,  85.00,  50, 2),
    ("Minute Maid Pineapple 300ml",   "Minute Maid","pcs",  55.00,  85.00,  40, 2),
    ("Minute Maid Guava 300ml",       "Minute Maid","pcs",  55.00,  85.00,  35, 2),
    ("Minute Maid Mixed Fruit 1L",    "Minute Maid","pcs", 115.00, 175.00,  35, 2),
    # Energy (cat 3)
    ("Monster Energy 500ml",          "Monster",   "pcs",  120.00, 180.00,  40, 3),
    ("Monster Ultra 500ml",           "Monster",   "pcs",  125.00, 185.00,  30, 3),
    ("Burn Energy 250ml",             "Burn",      "pcs",   55.00,  85.00,  35, 3),
    ("Burn Energy 500ml",             "Burn",      "pcs",   95.00, 145.00,  25, 3),
    # Teas (cat 5)
    ("Fuze Tea Black Lemon 500ml",    "Fuze Tea",  "pcs",   60.00,  90.00,  40, 5),
    ("Fuze Tea Green Peach 500ml",    "Fuze Tea",  "pcs",   60.00,  90.00,  35, 5),
    ("Gold Peak Sweet Tea 450ml",     "Gold Peak", "pcs",   65.00,  95.00,  20, 5),
    # Syrups (cat 6)
    ("Coca-Cola Bag-in-Box 10L",      "Coca-Cola", "box",  3500.00,5000.00,  8, 6),
    ("Sprite Bag-in-Box 10L",         "Sprite",    "box",  3200.00,4600.00,  5, 6),
    ("Fanta Orange Bag-in-Box 10L",   "Fanta",     "box",  3200.00,4600.00,  5, 6),
    # Multipacks (cat 7)
    ("Coca-Cola 6-Pack 300ml",        "Coca-Cola", "pack",  200.00, 300.00, 40, 7),
    ("Sprite 6-Pack 300ml",           "Sprite",    "pack",  195.00, 290.00, 30, 7),
    ("Fanta Variety 12-Pack 300ml",   "Fanta",     "pack",  380.00, 560.00, 20, 7),
    ("Water 12-Pack 500ml",           "Dasani",    "pack",  320.00, 480.00, 35, 7),
]

CUSTOMERS = [
    ("Nairobi Supermart",        "sales@nairobisupermart.co.ke",  "+254 722 001 001", "Westlands, Nairobi"),
    ("Carrefour Kenya",          "orders@carrefour.co.ke",        "+254 733 002 002", "TRM, Nairobi"),
    ("Quickmart Supermarkets",   "procurement@quickmart.co.ke",   "+254 700 003 003", "Embakasi, Nairobi"),
    ("Eastmatt Supermarkets",    "supply@eastmatt.co.ke",         "+254 741 004 004", "Mombasa Road, Nairobi"),
    ("Woolworths Kenya",         "stock@woolworths.co.ke",        "+254 712 005 005", "Karen, Nairobi"),
    ("Naivas Supermarket",       "orders@naivas.co.ke",           "+254 722 006 006", "Westgate, Nairobi"),
    ("HotelMate Supplies",       "info@hotelmate.co.ke",          "+254 733 007 007", "Upperhill, Nairobi"),
    ("Mombasa Beach Resorts Ltd","beverage@mbrltd.co.ke",         "+254 700 008 008", "Diani, Mombasa"),
    ("Eldoret Traders Ltd",      "eldo@traders.co.ke",            "+254 741 009 009", "Eldoret Town"),
    ("Kisumu Wholesale Hub",     "wholesale@kiswh.co.ke",         "+254 712 010 010", "Kisumu Central"),
    ("Nakuru Beverages Co.",     "info@nakurubev.co.ke",          "+254 722 011 011", "Nakuru Town"),
    ("Thika Road Mini-Marts",    "thika@minimarts.co.ke",         "+254 733 012 012", "Thika Road, Nairobi"),
    ("Safari Park Hotel",        "fbm@safaripark.co.ke",          "+254 700 013 013", "Kasarani, Nairobi"),
    ("Kenya Airways Catering",   "catering@kenya-airways.com",    "+254 741 014 014", "JKIA, Nairobi"),
    ("Equity Bank Canteen",      "canteen@equitybank.co.ke",      "+254 712 015 015", "Upper Hill, Nairobi"),
    ("KNH Cafeteria",            "cafeteria@knh.or.ke",           "+254 722 016 016", "Kenyatta Hospital"),
    ("University of Nairobi Sacco","sacco@uon.ac.ke",             "+254 733 017 017", "Main Campus, Nairobi"),
    ("Strathmore University",    "canteen@strathmore.edu",        "+254 700 018 018", "Madaraka, Nairobi"),
    ("Two Rivers Mall F&B",      "fb@tworiverslifestyle.co.ke",   "+254 741 019 019", "Runda, Nairobi"),
    ("The Village Market",       "tenants@villagemarket.co.ke",   "+254 712 020 020", "Gigiri, Nairobi"),
]

USERS = [
    # (username, first_name, last_name, email, role, department, password)
    ("admin",       "Admin",    "CCBA",      "admin@ccba.co.ke",          "admin",   "IT & Systems",        "password123"),
    ("jmwenda",     "John",     "Mwenda",    "jmwenda@ccba.co.ke",        "manager", "Inventory & Warehouse","password123"),
    ("akinuthia",   "Alice",    "Kinuthia",  "akinuthia@ccba.co.ke",      "sales",   "Sales & Distribution", "password123"),
    ("botieno",     "Brian",    "Otieno",    "botieno@ccba.co.ke",        "sales",   "Sales & Distribution", "password123"),
    ("cmutua",      "Caroline", "Mutua",     "cmutua@ccba.co.ke",         "sales",   "Sales & Distribution", "password123"),
    ("dkimani",     "David",    "Kimani",    "dkimani@ccba.co.ke",        "viewer",  "Finance",              "password123"),
    ("ewanjiku",    "Esther",   "Wanjiku",   "ewanjiku@ccba.co.ke",       "viewer",  "Finance",              "password123"),
]


class Command(BaseCommand):
    help = "Seed the database with ~1 year of realistic CCBA Coca-Cola inventory data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            default=date.today().year - 1 if date.today().month < 4 else date.today().year,
            help="Calendar year to generate data for (default: current or previous year)",
        )
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all existing data before seeding",
        )

    def handle(self, *args, **options):
        year = options["year"]
        flush = options["flush"]

        self.stdout.write(self.style.MIGRATE_HEADING(
            f"\n{'='*60}\n  CCBA Inventory MIS — Data Seeder\n  Seeding year: {year}\n{'='*60}\n"
        ))

        if flush:
            self._flush()

        with transaction.atomic():
            users      = self._seed_users()
            categories = self._seed_categories()
            suppliers  = self._seed_suppliers()
            products   = self._seed_products(categories, suppliers)
            customers  = self._seed_customers()
            self._seed_purchases(products, suppliers, users, year)
            self._seed_sales(products, customers, users, year)
            self._seed_adjustments(products, users, year)

        self.stdout.write(self.style.SUCCESS("\n✓ Seeding complete!\n"))
        self._print_summary()

    # ─── Flush ────────────────────────────────────────────────────────────────

    def _flush(self):
        self.stdout.write("  Flushing existing data…")
        StockAdjustment.objects.all().delete()
        SaleItem.objects.all().delete()
        Sale.objects.all().delete()
        PurchaseItem.objects.all().delete()
        Purchase.objects.all().delete()
        Product.objects.all().delete()
        Customer.objects.all().delete()
        Supplier.objects.all().delete()
        Category.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.WARNING("  ✓ Existing data flushed.\n"))

    # ─── Users ────────────────────────────────────────────────────────────────

    def _seed_users(self):
        self.stdout.write("  Creating users…")
        users = []
        for username, first, last, email, role, dept, password in USERS:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "first_name": first,
                    "last_name": last,
                    "email": email,
                    "role": role,
                    "department": dept,
                    "is_active": True,
                    "is_staff": role == "admin",
                    "is_superuser": role == "admin",
                }
            )
            if created:
                user.set_password(password)
                user.save()
            users.append(user)
        self.stdout.write(self.style.SUCCESS(f"    ✓ {len(users)} users"))
        return users

    # ─── Categories ───────────────────────────────────────────────────────────

    def _seed_categories(self):
        self.stdout.write("  Creating categories…")
        categories = []
        for name, desc in CATEGORIES:
            cat, _ = Category.objects.get_or_create(
                name=name,
                defaults={"description": desc, "slug": slugify(name), "is_active": True}
            )
            categories.append(cat)
        self.stdout.write(self.style.SUCCESS(f"    ✓ {len(categories)} categories"))
        return categories

    # ─── Suppliers ────────────────────────────────────────────────────────────

    def _seed_suppliers(self):
        self.stdout.write("  Creating suppliers…")
        suppliers = []
        for s in SUPPLIERS:
            sup, _ = Supplier.objects.get_or_create(
                name=s["name"],
                defaults={
                    "contact_person": s["contact_person"],
                    "email": s["email"],
                    "phone": s["phone"],
                    "city": s["city"],
                    "country": "Kenya",
                    "is_active": True,
                }
            )
            suppliers.append(sup)
        self.stdout.write(self.style.SUCCESS(f"    ✓ {len(suppliers)} suppliers"))
        return suppliers

    # ─── Products ─────────────────────────────────────────────────────────────

    def _seed_products(self, categories, suppliers):
        self.stdout.write("  Creating products…")
        products = []
        for i, (name, brand, unit, buy, sell, reorder, cat_idx) in enumerate(PRODUCTS):
            sku = f"CC-{cat_idx:02d}-{(i+1):03d}"
            supplier = random.choice(suppliers)
            prod, _ = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    "name": name,
                    "brand": brand,
                    "unit": unit,
                    "buying_price": Decimal(str(buy)),
                    "selling_price": Decimal(str(sell)),
                    "reorder_level": reorder,
                    "quantity_in_stock": random.randint(reorder * 2, reorder * 8),
                    "category": categories[cat_idx],
                    "supplier": supplier,
                    "status": "active",
                    "is_active": True,
                    "description": f"Premium {brand} {name} — CCBA Kenya distribution.",
                }
            )
            products.append(prod)
        self.stdout.write(self.style.SUCCESS(f"    ✓ {len(products)} products"))
        return products

    # ─── Customers ────────────────────────────────────────────────────────────

    def _seed_customers(self):
        self.stdout.write("  Creating customers…")
        customers = []
        for name, email, phone, address in CUSTOMERS:
            cust, _ = Customer.objects.get_or_create(
                name=name,
                defaults={
                    "email": email,
                    "phone": phone,
                    "address": address,
                    "city": address.split(",")[-1].strip(),
                    "is_active": True,
                }
            )
            customers.append(cust)
        self.stdout.write(self.style.SUCCESS(f"    ✓ {len(customers)} customers"))
        return customers

    # ─── Purchases ────────────────────────────────────────────────────────────

    def _seed_purchases(self, products, suppliers, users, year):
        self.stdout.write("  Generating purchases…")

        # Seasonality multiplier by month (Coca-Cola peaks in hot/festive months)
        MONTH_WEIGHT = {
            1: 1.0, 2: 0.9, 3: 1.0, 4: 0.9,
            5: 1.1, 6: 1.2, 7: 1.2, 8: 1.1,
            9: 1.0, 10: 1.1, 11: 1.3, 12: 1.5,
        }

        managers = [u for u in users if u.role in ("admin", "manager")]
        purchase_count = 0
        ref_counter = 1

        for month in range(1, 13):
            weight = MONTH_WEIGHT[month]
            # 4-8 POs per month, more in peak months
            num_pos = int(random.randint(4, 8) * weight)

            for _ in range(num_pos):
                day = random.randint(1, 28)
                try:
                    po_date = date(year, month, day)
                except ValueError:
                    po_date = date(year, month, 28)

                supplier = random.choice(suppliers)
                created_by = random.choice(managers)
                status = "received" if po_date < date.today() else "pending"

                reference = f"PO-{year}-{ref_counter:04d}"
                ref_counter += 1

                # Skip if already exists
                if Purchase.objects.filter(reference=reference).exists():
                    continue

                po = Purchase.objects.create(
                    reference=reference,
                    supplier=supplier,
                    created_by=created_by,
                    status=status,
                    purchase_date=po_date,
                    received_date=po_date + timedelta(days=random.randint(1, 5)) if status == "received" else None,
                    notes=random.choice([
                        "Regular monthly restocking order.",
                        "Emergency reorder — low stock alert triggered.",
                        "Festive season stock build-up.",
                        "Promotional campaign supply.",
                        "Top-up order for high-velocity SKUs.",
                        "",
                    ]),
                )

                # 3–10 line items per PO
                selected = random.sample(products, k=random.randint(3, min(10, len(products))))
                total = Decimal("0")

                for product in selected:
                    qty = random.randint(20, 200)
                    # Buying price ± 5% variance
                    cost = product.buying_price * Decimal(str(round(random.uniform(0.95, 1.05), 4)))
                    cost = cost.quantize(Decimal("0.01"))

                    PurchaseItem.objects.create(
                        purchase=po,
                        product=product,
                        quantity=qty,
                        unit_cost=cost,
                    )
                    total += qty * cost

                    # Update stock if received
                    if status == "received":
                        product.quantity_in_stock += qty
                        product.save(update_fields=["quantity_in_stock"])

                po.total_amount = total
                po.save(update_fields=["total_amount"])
                purchase_count += 1

        self.stdout.write(self.style.SUCCESS(f"    ✓ {purchase_count} purchase orders with line items"))

    # ─── Sales ────────────────────────────────────────────────────────────────

    def _seed_sales(self, products, customers, users, year):
        self.stdout.write("  Generating sales transactions…")

        MONTH_WEIGHT = {
            1: 1.0, 2: 0.9, 3: 1.0, 4: 0.9,
            5: 1.1, 6: 1.2, 7: 1.2, 8: 1.1,
            9: 1.0, 10: 1.1, 11: 1.3, 12: 1.5,
        }

        PAYMENT_METHODS = ["cash", "mpesa", "bank", "credit"]
        PAYMENT_WEIGHTS = [0.35, 0.40, 0.15, 0.10]  # mpesa dominant in Kenya

        sales_reps = [u for u in users if u.role in ("admin", "manager", "sales")]
        sale_count = 0
        ref_counter = 1

        for month in range(1, 13):
            weight = MONTH_WEIGHT[month]
            # 40–90 sales per month; scale with seasonality
            num_sales = int(random.randint(40, 90) * weight)

            for _ in range(num_sales):
                day = random.randint(1, 28)
                try:
                    sale_date = date(year, month, day)
                except ValueError:
                    sale_date = date(year, month, 28)

                # Don't create future sales
                if sale_date > date.today():
                    continue

                reference = f"SALE-{year}-{ref_counter:05d}"
                ref_counter += 1

                if Sale.objects.filter(reference=reference).exists():
                    continue

                customer = random.choice(customers + [None] * 5)  # 5/25 walk-in chance
                sold_by = random.choice(sales_reps)
                payment_method = random.choices(PAYMENT_METHODS, weights=PAYMENT_WEIGHTS)[0]

                # Status: overwhelmingly completed, small % pending/cancelled
                status = random.choices(
                    ["completed", "pending", "cancelled", "refunded"],
                    weights=[0.88, 0.06, 0.04, 0.02],
                )[0]

                global_discount = Decimal("0")
                tax_amount = Decimal("0")

                # Large customers occasionally get a 2-5% global discount
                if customer and random.random() < 0.15:
                    # We'll compute after items
                    add_discount = True
                else:
                    add_discount = False

                sale = Sale.objects.create(
                    reference=reference,
                    customer=customer,
                    sold_by=sold_by,
                    status=status,
                    payment_method=payment_method,
                    sale_date=sale_date,
                    discount=Decimal("0"),
                    tax=Decimal("0"),
                    subtotal=Decimal("0"),
                    total_amount=Decimal("0"),
                    notes=random.choice([
                        "Bulk order for event catering.",
                        "Monthly standing order.",
                        "Promotional bundle sale.",
                        "Regular weekly restock.",
                        "One-off order.",
                        "",
                        "",
                        "",
                    ]),
                )

                # 1–6 line items per sale
                available = [p for p in products if p.quantity_in_stock > 0]
                if not available:
                    available = products  # fallback — seed ignores stock in historical context

                num_items = random.randint(1, min(6, len(available)))
                selected = random.sample(available, k=num_items)

                subtotal = Decimal("0")

                for product in selected:
                    # Higher velocity for flagship SKUs
                    if "300ml" in product.name or "Crate" in product.name:
                        qty = random.randint(5, 50)
                    elif "1.5L" in product.name or "1L" in product.name:
                        qty = random.randint(3, 20)
                    elif "Bag-in-Box" in product.name:
                        qty = random.randint(1, 5)
                    else:
                        qty = random.randint(2, 30)

                    unit_price = product.selling_price
                    item_discount = Decimal("0")

                    # 10% chance of per-item line discount
                    if random.random() < 0.10:
                        disc_pct = Decimal(str(round(random.uniform(0.02, 0.08), 3)))
                        item_discount = (unit_price * qty * disc_pct).quantize(Decimal("0.01"))

                    item_subtotal = (unit_price * qty) - item_discount
                    subtotal += item_subtotal

                    SaleItem.objects.create(
                        sale=sale,
                        product=product,
                        quantity=qty,
                        unit_price=unit_price,
                        unit_cost=product.buying_price,
                        discount=item_discount,
                    )

                    # Deduct from stock only for completed sales
                    if status == "completed":
                        product.quantity_in_stock = max(0, product.quantity_in_stock - qty)
                        product.save(update_fields=["quantity_in_stock"])

                # Apply global discount
                if add_discount and subtotal > 0:
                    disc_pct = Decimal(str(round(random.uniform(0.02, 0.05), 3)))
                    global_discount = (subtotal * disc_pct).quantize(Decimal("0.01"))

                # VAT 16% on completed sales occasionally
                if status == "completed" and random.random() < 0.30:
                    tax_amount = ((subtotal - global_discount) * Decimal("0.16")).quantize(Decimal("0.01"))

                total = subtotal - global_discount + tax_amount

                sale.subtotal = subtotal
                sale.discount = global_discount
                sale.tax = tax_amount
                sale.total_amount = total
                sale.save(update_fields=["subtotal", "discount", "tax", "total_amount"])

                sale_count += 1

        self.stdout.write(self.style.SUCCESS(f"    ✓ {sale_count} sales transactions with line items"))

    # ─── Stock Adjustments ────────────────────────────────────────────────────

    def _seed_adjustments(self, products, users, year):
        self.stdout.write("  Generating stock adjustments…")

        managers = [u for u in users if u.role in ("admin", "manager")]
        adj_count = 0

        ADJ_TYPES = [
            ("addition",   "addition",  "Stock addition after supplier delivery reconciliation."),
            ("deduction",  "deduction", "Stock removed — expired units identified during audit."),
            ("damage",     "damage",    "Damaged during warehouse handling or transit."),
            ("return",     "return",    "Customer return processed — units back to stock."),
            ("correction", "correction","Cycle count correction — physical vs system variance."),
        ]

        # ~3-5 adjustments per month, spread across random products
        for month in range(1, 13):
            num_adj = random.randint(3, 5)
            for _ in range(num_adj):
                day = random.randint(1, 28)
                try:
                    adj_date = date(year, month, day)
                except ValueError:
                    adj_date = date(year, month, 28)

                if adj_date > date.today():
                    continue

                product = random.choice(products)
                adj_type_key, adj_type, reason = random.choice(ADJ_TYPES)
                adjusted_by = random.choice(managers)

                qty_before = product.quantity_in_stock

                if adj_type_key in ("deduction", "damage"):
                    qty = random.randint(1, max(1, int(qty_before * 0.05)))
                    qty_after = max(0, qty_before - qty)
                    qty_signed = -qty
                elif adj_type_key == "return":
                    qty = random.randint(1, 10)
                    qty_after = qty_before + qty
                    qty_signed = qty
                elif adj_type_key == "addition":
                    qty = random.randint(5, 50)
                    qty_after = qty_before + qty
                    qty_signed = qty
                else:  # correction
                    delta = random.randint(-15, 15)
                    qty_after = max(0, qty_before + delta)
                    qty_signed = delta

                StockAdjustment.objects.create(
                    product=product,
                    adjusted_by=adjusted_by,
                    adjustment_type=adj_type_key,
                    quantity=qty_signed,
                    quantity_before=qty_before,
                    quantity_after=qty_after,
                    reason=reason,
                    reference=f"ADJ-{year}-{month:02d}-{random.randint(100,999)}",
                )

                product.quantity_in_stock = qty_after
                product.save(update_fields=["quantity_in_stock"])

                adj_count += 1

        self.stdout.write(self.style.SUCCESS(f"    ✓ {adj_count} stock adjustments"))

    # ─── Summary ──────────────────────────────────────────────────────────────

    def _print_summary(self):
        self.stdout.write(self.style.MIGRATE_HEADING("  Database Summary"))
        rows = [
            ("Users",             User.objects.count()),
            ("Categories",        Category.objects.count()),
            ("Suppliers",         Supplier.objects.count()),
            ("Products",          Product.objects.count()),
            ("Customers",         Customer.objects.count()),
            ("Purchase Orders",   Purchase.objects.count()),
            ("Purchase Items",    PurchaseItem.objects.count()),
            ("Sales",             Sale.objects.count()),
            ("Sale Items",        SaleItem.objects.count()),
            ("Stock Adjustments", StockAdjustment.objects.count()),
        ]
        for label, count in rows:
            self.stdout.write(f"    {label:<22} {count:>6,}")

        total_revenue = sum(
            float(s.total_amount)
            for s in Sale.objects.filter(status="completed")
        )
        self.stdout.write(
            f"\n  Total Completed Revenue:  KES {total_revenue:>14,.2f}"
        )
        self.stdout.write(
            "\n  Default credentials:"
            "\n    admin    / Admin@1234"
            "\n    jmwenda  / Manager@1234"
            "\n    akinuthia/ Sales@1234\n"
        )