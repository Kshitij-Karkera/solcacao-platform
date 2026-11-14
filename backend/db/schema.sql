-- SolCacao database schema: SQL Server / Azure SQL (T-SQL), 13 tables.
-- Same tables, columns and relationships as SolCacao_schema.sql. Implementation additions
-- (auto-numbering IDs, defaults, a unique email, and extra columns the API needs) are marked "-- +".
-- Run once: npm run db:migrate. Batches are separated by GO lines (scripts/run-sql.js splits on them).
-- Tables are only created if missing. To rebuild from scratch run: npm run db:reset first.

IF OBJECT_ID('dbo.Users') IS NULL
CREATE TABLE dbo.Users (
    user_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,                -- + auto-number
    email NVARCHAR(255) NOT NULL CONSTRAINT uq_Users_email UNIQUE, -- + unique (case-insensitive)
    password_hash NVARCHAR(255) NOT NULL,
    name NVARCHAR(150) NOT NULL,
    account_type NVARCHAR(20) NOT NULL,                            -- 'retail' | 'b2b'
    [role] NVARCHAR(50) NULL,
    language NVARCHAR(10) NOT NULL DEFAULT 'en',                   -- + default
    created_at DATETIME NOT NULL DEFAULT GETDATE()                 -- + default
);
GO

IF OBJECT_ID('dbo.Addresses') IS NULL
CREATE TABLE dbo.Addresses (
    address_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    user_id INT NOT NULL,
    type NVARCHAR(20) NULL,                                        -- label: Home, Work ...
    street NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    state NVARCHAR(100) NULL,
    postal_code NVARCHAR(20) NULL,
    country NVARCHAR(100) NOT NULL,
    street2 NVARCHAR(255) NULL,                                    -- + address line 2
    is_default BIT NOT NULL DEFAULT 0,                             -- + default address flag
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

IF OBJECT_ID('dbo.CorporatePartners') IS NULL
CREATE TABLE dbo.CorporatePartners (
    partner_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    company_name NVARCHAR(200) NOT NULL,
    tax_id NVARCHAR(50) NULL,
    industry NVARCHAR(100) NULL,
    approval_status NVARCHAR(20) NOT NULL DEFAULT 'pending',       -- 'pending' | 'approved' | 'rejected'
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

IF OBJECT_ID('dbo.Inquiries') IS NULL
CREATE TABLE dbo.Inquiries (
    inquiry_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    user_id INT NULL,
    name_email NVARCHAR(255) NOT NULL,                             -- stored as: Name <email>
    category NVARCHAR(50) NOT NULL,                                -- general | wholesale | order | press | feedback | sampler
    message NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'new',
    submitted_at DATETIME NOT NULL DEFAULT GETDATE(),
    company NVARCHAR(150) NULL,                                    -- + optional company
    payload NVARCHAR(MAX) NULL CHECK (payload IS NULL OR ISJSON(payload) = 1), -- + extras (language, sampler picks)
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

IF OBJECT_ID('dbo.Products') IS NULL
CREATE TABLE dbo.Products (
    product_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    sku NVARCHAR(50) NOT NULL CONSTRAINT uq_Products_sku UNIQUE,   -- + unique; public product id, e.g. 'sierra-nevada-85'
    localized_name NVARCHAR(255) NOT NULL CHECK (ISJSON(localized_name) = 1), -- JSON {"en": "...", "es": "..."}
    category_origin NVARCHAR(100) NULL,                            -- origin country, e.g. 'Ecuador'
    price DECIMAL(10,2) NOT NULL,
    cacao_percent DECIMAL(5,2) NOT NULL,
    category NVARCHAR(20) NOT NULL DEFAULT 'bars'
        CHECK (category IN ('bars','truffles','bonbons','seasonal','sampler')), -- + product category
    localized_description NVARCHAR(MAX) NOT NULL DEFAULT '{}' CHECK (ISJSON(localized_description) = 1), -- + JSON {"en","es"}
    localized_notes NVARCHAR(1000) NULL CHECK (localized_notes IS NULL OR ISJSON(localized_notes) = 1),  -- + JSON {"en","es"}
    weight NVARCHAR(50) NULL,                                      -- +
    image_url NVARCHAR(500) NULL,                                  -- +
    seasonal BIT NOT NULL DEFAULT 0,                               -- +
    active BIT NOT NULL DEFAULT 1,                                 -- + 0 = hidden from the catalog
    created_at DATETIME NOT NULL DEFAULT GETDATE()                 -- +
);
CREATE INDEX idx_Products_origin ON dbo.Products(category_origin);
CREATE INDEX idx_Products_cacao ON dbo.Products(cacao_percent);
CREATE INDEX idx_Products_price ON dbo.Products(price);
GO

IF OBJECT_ID('dbo.Inventory') IS NULL
CREATE TABLE dbo.Inventory (
    inventory_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    product_id INT NOT NULL UNIQUE,
    quantity_on_hand INT NOT NULL,
    reserved_quantity INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 10,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
GO

IF OBJECT_ID('dbo.Carts') IS NULL
BEGIN
    CREATE TABLE dbo.Carts (
        cart_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NULL,
        guest_session_id NVARCHAR(100) NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        expires_at DATETIME NULL,
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
    );
    -- + one active cart per signed-in user
    CREATE UNIQUE INDEX ux_Carts_active_user ON dbo.Carts(user_id) WHERE status = 'active' AND user_id IS NOT NULL;
END
GO

IF OBJECT_ID('dbo.CartItems') IS NULL
CREATE TABLE dbo.CartItems (
    cart_item_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0 AND quantity <= 999),
    unit_price DECIMAL(10,2) NOT NULL,
    item_key NVARCHAR(120) NOT NULL,                               -- + client cart key (a product sku, or 'sampler-...' for custom boxes)
    meta NVARCHAR(MAX) NULL CHECK (meta IS NULL OR ISJSON(meta) = 1), -- + name / detail / image snapshot
    FOREIGN KEY (cart_id) REFERENCES Carts(cart_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    CONSTRAINT uq_CartItems_cart_key UNIQUE (cart_id, item_key)
);
GO

IF OBJECT_ID('dbo.RetailOrders') IS NULL
CREATE TABLE dbo.RetailOrders (
    order_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    user_id INT NULL,
    cart_id INT NULL,
    guest_email NVARCHAR(255) NULL,
    order_status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_status NVARCHAR(20) NOT NULL DEFAULT 'unpaid',
    total DECIMAL(10,2) NOT NULL,
    placed_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (cart_id) REFERENCES Carts(cart_id)
);
GO

IF OBJECT_ID('dbo.OrderItems') IS NULL
CREATE TABLE dbo.OrderItems (
    order_item_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    product_snapshot NVARCHAR(MAX) NULL,
    FOREIGN KEY (order_id) REFERENCES RetailOrders(order_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
GO

IF OBJECT_ID('dbo.B2BQuoteRequests') IS NULL
CREATE TABLE dbo.B2BQuoteRequests (
    quote_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    partner_id INT NOT NULL,
    cacao_profile NVARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NULL,
    packaging NVARCHAR(50) NOT NULL,
    branding_notes NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'received',
    needed_by DATE NULL,
    submitted_at DATETIME NOT NULL DEFAULT GETDATE(),
    reference NVARCHAR(20) NOT NULL CONSTRAINT uq_B2BQuoteRequests_reference UNIQUE, -- + human-friendly id, e.g. SC-7F3K2A
    company NVARCHAR(150) NOT NULL,                                -- +
    contact_name NVARCHAR(100) NOT NULL,                           -- +
    contact_email NVARCHAR(255) NOT NULL,                          -- +
    finishes NVARCHAR(MAX) NOT NULL DEFAULT '[]' CHECK (ISJSON(finishes) = 1), -- + JSON array, e.g. ["Gold foil","Ribbon"]
    FOREIGN KEY (partner_id) REFERENCES CorporatePartners(partner_id)
);
GO

IF OBJECT_ID('dbo.DesignFiles') IS NULL
CREATE TABLE dbo.DesignFiles (
    file_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    quote_id INT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_type NVARCHAR(20) NOT NULL,
    storage_url NVARCHAR(500) NOT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (quote_id) REFERENCES B2BQuoteRequests(quote_id)
);
GO

IF OBJECT_ID('dbo.NotificationLog') IS NULL
CREATE TABLE dbo.NotificationLog (
    notification_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    channel NVARCHAR(20) NOT NULL,
    recipient NVARCHAR(255) NOT NULL,
    source_type NVARCHAR(20) NOT NULL,
    source_id INT NOT NULL,
    inquiry_id INT NULL,
    retail_order_id INT NULL,
    b2b_quote_request_id INT NULL,
    delivery_status NVARCHAR(20) NOT NULL,
    sent_at DATETIME NULL,
    FOREIGN KEY (inquiry_id) REFERENCES Inquiries(inquiry_id),
    FOREIGN KEY (retail_order_id) REFERENCES RetailOrders(order_id),
    FOREIGN KEY (b2b_quote_request_id) REFERENCES B2BQuoteRequests(quote_id)
);
GO
