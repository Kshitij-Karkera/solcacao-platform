
CREATE TABLE Users (
    user_id INT NOT NULL PRIMARY KEY,
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    name NVARCHAR(150) NOT NULL,
    account_type NVARCHAR(20) NOT NULL,
    role NVARCHAR(50) NULL,
    language NVARCHAR(10) NOT NULL,
    created_at DATETIME NOT NULL
);

CREATE TABLE Addresses (
    address_id INT NOT NULL PRIMARY KEY,
    user_id INT NOT NULL,
    type NVARCHAR(20) NULL,
    street NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    state NVARCHAR(100) NULL,
    postal_code NVARCHAR(20) NULL,
    country NVARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE CorporatePartners (
    partner_id INT NOT NULL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    company_name NVARCHAR(200) NOT NULL,
    tax_id NVARCHAR(50) NULL,
    industry NVARCHAR(100) NULL,
    approval_status NVARCHAR(20) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Inquiries (
    inquiry_id INT NOT NULL PRIMARY KEY,
    user_id INT NULL,
    name_email NVARCHAR(255) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    submitted_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Products (
    product_id INT NOT NULL PRIMARY KEY,
    sku NVARCHAR(50) NOT NULL,
    localized_name NVARCHAR(255) NOT NULL,
    category_origin NVARCHAR(100) NULL,
    price DECIMAL(10,2) NOT NULL,
    cacao_percent DECIMAL(5,2) NOT NULL
);

CREATE TABLE Inventory (
    inventory_id INT NOT NULL PRIMARY KEY,
    product_id INT NOT NULL UNIQUE,
    quantity_on_hand INT NOT NULL,
    reserved_quantity INT NOT NULL,
    reorder_level INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE Carts (
    cart_id INT NOT NULL PRIMARY KEY,
    user_id INT NULL,
    guest_session_id NVARCHAR(100) NULL,
    status NVARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE CartItems (
    cart_item_id INT NOT NULL PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES Carts(cart_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE RetailOrders (
    order_id INT NOT NULL PRIMARY KEY,
    user_id INT NULL,
    cart_id INT NULL,
    guest_email NVARCHAR(255) NULL,
    order_status NVARCHAR(20) NOT NULL,
    payment_status NVARCHAR(20) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    placed_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (cart_id) REFERENCES Carts(cart_id)
);

CREATE TABLE OrderItems (
    order_item_id INT NOT NULL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    product_snapshot NVARCHAR(MAX) NULL,
    FOREIGN KEY (order_id) REFERENCES RetailOrders(order_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE B2BQuoteRequests (
    quote_id INT NOT NULL PRIMARY KEY,
    partner_id INT NOT NULL,
    cacao_profile NVARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NULL,
    packaging NVARCHAR(50) NOT NULL,
    branding_notes NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL,
    needed_by DATE NULL,
    submitted_at DATETIME NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES CorporatePartners(partner_id)
);

CREATE TABLE DesignFiles (
    file_id INT NOT NULL PRIMARY KEY,
    quote_id INT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_type NVARCHAR(20) NOT NULL,
    storage_url NVARCHAR(500) NOT NULL,
    uploaded_at DATETIME NOT NULL,
    FOREIGN KEY (quote_id) REFERENCES B2BQuoteRequests(quote_id)
);

CREATE TABLE NotificationLog (
    notification_id INT NOT NULL PRIMARY KEY,
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
