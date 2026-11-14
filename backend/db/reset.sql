-- Drops every SolCacao table (children first) so schema.sql can rebuild them. DESTROYS ALL DATA.
-- Run with: npm run db:reset
-- First the tables of the earlier 11-table backend design, if they exist (they reference the shared ones):
IF OBJECT_ID('dbo.cart_items') IS NOT NULL DROP TABLE dbo.cart_items;
GO
IF OBJECT_ID('dbo.b2b_quote_requests') IS NOT NULL DROP TABLE dbo.b2b_quote_requests;
GO
IF OBJECT_ID('dbo.user_roles') IS NOT NULL DROP TABLE dbo.user_roles;
GO
IF OBJECT_ID('dbo.corporate_partners') IS NOT NULL DROP TABLE dbo.corporate_partners;
GO
IF OBJECT_ID('dbo.translations') IS NOT NULL DROP TABLE dbo.translations;
GO
-- Then the 13 SolCacao tables:
IF OBJECT_ID('dbo.NotificationLog') IS NOT NULL DROP TABLE dbo.NotificationLog;
GO
IF OBJECT_ID('dbo.DesignFiles') IS NOT NULL DROP TABLE dbo.DesignFiles;
GO
IF OBJECT_ID('dbo.B2BQuoteRequests') IS NOT NULL DROP TABLE dbo.B2BQuoteRequests;
GO
IF OBJECT_ID('dbo.OrderItems') IS NOT NULL DROP TABLE dbo.OrderItems;
GO
IF OBJECT_ID('dbo.RetailOrders') IS NOT NULL DROP TABLE dbo.RetailOrders;
GO
IF OBJECT_ID('dbo.CartItems') IS NOT NULL DROP TABLE dbo.CartItems;
GO
IF OBJECT_ID('dbo.Carts') IS NOT NULL DROP TABLE dbo.Carts;
GO
IF OBJECT_ID('dbo.Inventory') IS NOT NULL DROP TABLE dbo.Inventory;
GO
IF OBJECT_ID('dbo.Products') IS NOT NULL DROP TABLE dbo.Products;
GO
IF OBJECT_ID('dbo.Inquiries') IS NOT NULL DROP TABLE dbo.Inquiries;
GO
IF OBJECT_ID('dbo.CorporatePartners') IS NOT NULL DROP TABLE dbo.CorporatePartners;
GO
IF OBJECT_ID('dbo.Addresses') IS NOT NULL DROP TABLE dbo.Addresses;
GO
IF OBJECT_ID('dbo.Users') IS NOT NULL DROP TABLE dbo.Users;
GO
