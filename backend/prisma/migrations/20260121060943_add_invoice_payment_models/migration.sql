BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[companies] ADD [fiscalYearStart] INT NOT NULL CONSTRAINT [companies_fiscalYearStart_df] DEFAULT 1;

-- CreateTable
CREATE TABLE [dbo].[accounts] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(20) NOT NULL,
    [name] VARCHAR(255) NOT NULL,
    [type] VARCHAR(20) NOT NULL,
    [category] VARCHAR(50) NOT NULL,
    [subCategory] VARCHAR(50),
    [currency] VARCHAR(3) NOT NULL CONSTRAINT [accounts_currency_df] DEFAULT 'MUR',
    [description] VARCHAR(500),
    [parentId] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [accounts_isActive_df] DEFAULT 1,
    [isSystem] BIT NOT NULL CONSTRAINT [accounts_isSystem_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [accounts_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [accounts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [accounts_tenantId_companyId_code_key] UNIQUE NONCLUSTERED ([tenantId],[companyId],[code])
);

-- CreateTable
CREATE TABLE [dbo].[fiscal_periods] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [name] VARCHAR(100) NOT NULL,
    [periodType] VARCHAR(20) NOT NULL,
    [startDate] DATETIME2 NOT NULL,
    [endDate] DATETIME2 NOT NULL,
    [status] VARCHAR(20) NOT NULL CONSTRAINT [fiscal_periods_status_df] DEFAULT 'OPEN',
    [closedBy] NVARCHAR(1000),
    [closedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [fiscal_periods_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [fiscal_periods_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [fiscal_periods_tenantId_companyId_startDate_endDate_key] UNIQUE NONCLUSTERED ([tenantId],[companyId],[startDate],[endDate])
);

-- CreateTable
CREATE TABLE [dbo].[journal_entries] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [fiscalPeriodId] NVARCHAR(1000) NOT NULL,
    [entryNumber] VARCHAR(50) NOT NULL,
    [entryDate] DATETIME2 NOT NULL,
    [entryType] VARCHAR(20) NOT NULL CONSTRAINT [journal_entries_entryType_df] DEFAULT 'MANUAL',
    [reference] VARCHAR(100),
    [description] VARCHAR(500) NOT NULL,
    [status] VARCHAR(20) NOT NULL CONSTRAINT [journal_entries_status_df] DEFAULT 'DRAFT',
    [createdBy] NVARCHAR(1000) NOT NULL,
    [postedBy] NVARCHAR(1000),
    [postedAt] DATETIME2,
    [reversedBy] NVARCHAR(1000),
    [reversedAt] DATETIME2,
    [reversingEntryId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [journal_entries_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [journal_entries_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [journal_entries_tenantId_companyId_entryNumber_key] UNIQUE NONCLUSTERED ([tenantId],[companyId],[entryNumber])
);

-- CreateTable
CREATE TABLE [dbo].[journal_lines] (
    [id] NVARCHAR(1000) NOT NULL,
    [journalEntryId] NVARCHAR(1000) NOT NULL,
    [accountId] NVARCHAR(1000) NOT NULL,
    [lineNumber] INT NOT NULL,
    [debit] DECIMAL(18,2) NOT NULL CONSTRAINT [journal_lines_debit_df] DEFAULT 0,
    [credit] DECIMAL(18,2) NOT NULL CONSTRAINT [journal_lines_credit_df] DEFAULT 0,
    [description] VARCHAR(500),
    [reference] VARCHAR(100),
    CONSTRAINT [journal_lines_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [journal_lines_journalEntryId_lineNumber_key] UNIQUE NONCLUSTERED ([journalEntryId],[lineNumber])
);

-- CreateTable
CREATE TABLE [dbo].[customers] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(50) NOT NULL,
    [name] VARCHAR(255) NOT NULL,
    [legalName] VARCHAR(255),
    [email] VARCHAR(255),
    [phone] VARCHAR(50),
    [mobile] VARCHAR(50),
    [website] VARCHAR(255),
    [taxId] VARCHAR(100),
    [address] VARCHAR(500),
    [city] VARCHAR(100),
    [state] VARCHAR(100),
    [postalCode] VARCHAR(20),
    [country] VARCHAR(2) NOT NULL CONSTRAINT [customers_country_df] DEFAULT 'MU',
    [currency] VARCHAR(3) NOT NULL CONSTRAINT [customers_currency_df] DEFAULT 'MUR',
    [paymentTerms] INT NOT NULL CONSTRAINT [customers_paymentTerms_df] DEFAULT 30,
    [creditLimit] DECIMAL(18,2),
    [notes] VARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [customers_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [customers_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [customers_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [customers_tenantId_companyId_code_key] UNIQUE NONCLUSTERED ([tenantId],[companyId],[code])
);

-- CreateTable
CREATE TABLE [dbo].[invoices] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [customerId] NVARCHAR(1000) NOT NULL,
    [invoiceNumber] VARCHAR(50) NOT NULL,
    [invoiceDate] DATETIME2 NOT NULL,
    [dueDate] DATETIME2 NOT NULL,
    [reference] VARCHAR(100),
    [description] VARCHAR(500),
    [subtotal] DECIMAL(18,2) NOT NULL CONSTRAINT [invoices_subtotal_df] DEFAULT 0,
    [taxAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [invoices_taxAmount_df] DEFAULT 0,
    [totalAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [invoices_totalAmount_df] DEFAULT 0,
    [paidAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [invoices_paidAmount_df] DEFAULT 0,
    [currency] VARCHAR(3) NOT NULL CONSTRAINT [invoices_currency_df] DEFAULT 'MUR',
    [status] VARCHAR(20) NOT NULL CONSTRAINT [invoices_status_df] DEFAULT 'DRAFT',
    [notes] VARCHAR(1000),
    [journalEntryId] NVARCHAR(1000),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [invoices_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [invoices_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [invoices_tenantId_companyId_invoiceNumber_key] UNIQUE NONCLUSTERED ([tenantId],[companyId],[invoiceNumber])
);

-- CreateTable
CREATE TABLE [dbo].[invoice_lines] (
    [id] NVARCHAR(1000) NOT NULL,
    [invoiceId] NVARCHAR(1000) NOT NULL,
    [lineNumber] INT NOT NULL,
    [description] VARCHAR(500) NOT NULL,
    [quantity] DECIMAL(18,4) NOT NULL CONSTRAINT [invoice_lines_quantity_df] DEFAULT 1,
    [unitPrice] DECIMAL(18,2) NOT NULL CONSTRAINT [invoice_lines_unitPrice_df] DEFAULT 0,
    [taxRate] DECIMAL(5,2) NOT NULL CONSTRAINT [invoice_lines_taxRate_df] DEFAULT 0,
    [taxAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [invoice_lines_taxAmount_df] DEFAULT 0,
    [lineTotal] DECIMAL(18,2) NOT NULL CONSTRAINT [invoice_lines_lineTotal_df] DEFAULT 0,
    [accountId] NVARCHAR(1000),
    CONSTRAINT [invoice_lines_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [invoice_lines_invoiceId_lineNumber_key] UNIQUE NONCLUSTERED ([invoiceId],[lineNumber])
);

-- CreateTable
CREATE TABLE [dbo].[payments] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [customerId] NVARCHAR(1000),
    [supplierId] NVARCHAR(1000),
    [paymentNumber] VARCHAR(50) NOT NULL,
    [paymentDate] DATETIME2 NOT NULL,
    [paymentMethod] VARCHAR(50) NOT NULL,
    [reference] VARCHAR(100),
    [amount] DECIMAL(18,2) NOT NULL,
    [currency] VARCHAR(3) NOT NULL CONSTRAINT [payments_currency_df] DEFAULT 'MUR',
    [notes] VARCHAR(1000),
    [journalEntryId] NVARCHAR(1000),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [payments_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [payments_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [payments_tenantId_companyId_paymentNumber_key] UNIQUE NONCLUSTERED ([tenantId],[companyId],[paymentNumber])
);

-- CreateTable
CREATE TABLE [dbo].[suppliers] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(50) NOT NULL,
    [name] VARCHAR(255) NOT NULL,
    [legalName] VARCHAR(255),
    [email] VARCHAR(255),
    [phone] VARCHAR(50),
    [mobile] VARCHAR(50),
    [website] VARCHAR(255),
    [taxId] VARCHAR(100),
    [address] VARCHAR(500),
    [city] VARCHAR(100),
    [state] VARCHAR(100),
    [postalCode] VARCHAR(20),
    [country] VARCHAR(2) NOT NULL CONSTRAINT [suppliers_country_df] DEFAULT 'MU',
    [currency] VARCHAR(3) NOT NULL CONSTRAINT [suppliers_currency_df] DEFAULT 'MUR',
    [paymentTerms] INT NOT NULL CONSTRAINT [suppliers_paymentTerms_df] DEFAULT 30,
    [notes] VARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [suppliers_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [suppliers_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [suppliers_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [suppliers_tenantId_companyId_code_key] UNIQUE NONCLUSTERED ([tenantId],[companyId],[code])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [accounts_tenantId_companyId_type_idx] ON [dbo].[accounts]([tenantId], [companyId], [type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [accounts_tenantId_companyId_category_idx] ON [dbo].[accounts]([tenantId], [companyId], [category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [fiscal_periods_tenantId_companyId_status_idx] ON [dbo].[fiscal_periods]([tenantId], [companyId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [journal_entries_tenantId_companyId_entryDate_idx] ON [dbo].[journal_entries]([tenantId], [companyId], [entryDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [journal_entries_tenantId_companyId_status_idx] ON [dbo].[journal_entries]([tenantId], [companyId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [journal_entries_tenantId_companyId_fiscalPeriodId_idx] ON [dbo].[journal_entries]([tenantId], [companyId], [fiscalPeriodId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [journal_lines_accountId_idx] ON [dbo].[journal_lines]([accountId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [customers_tenantId_companyId_name_idx] ON [dbo].[customers]([tenantId], [companyId], [name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [invoices_tenantId_companyId_customerId_idx] ON [dbo].[invoices]([tenantId], [companyId], [customerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [invoices_tenantId_companyId_status_idx] ON [dbo].[invoices]([tenantId], [companyId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [invoices_tenantId_companyId_invoiceDate_idx] ON [dbo].[invoices]([tenantId], [companyId], [invoiceDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [payments_tenantId_companyId_customerId_idx] ON [dbo].[payments]([tenantId], [companyId], [customerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [payments_tenantId_companyId_supplierId_idx] ON [dbo].[payments]([tenantId], [companyId], [supplierId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [payments_tenantId_companyId_paymentDate_idx] ON [dbo].[payments]([tenantId], [companyId], [paymentDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [suppliers_tenantId_companyId_name_idx] ON [dbo].[suppliers]([tenantId], [companyId], [name]);

-- AddForeignKey
ALTER TABLE [dbo].[accounts] ADD CONSTRAINT [accounts_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[accounts] ADD CONSTRAINT [accounts_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[accounts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[fiscal_periods] ADD CONSTRAINT [fiscal_periods_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[journal_entries] ADD CONSTRAINT [journal_entries_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[journal_entries] ADD CONSTRAINT [journal_entries_fiscalPeriodId_fkey] FOREIGN KEY ([fiscalPeriodId]) REFERENCES [dbo].[fiscal_periods]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[journal_lines] ADD CONSTRAINT [journal_lines_journalEntryId_fkey] FOREIGN KEY ([journalEntryId]) REFERENCES [dbo].[journal_entries]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[journal_lines] ADD CONSTRAINT [journal_lines_accountId_fkey] FOREIGN KEY ([accountId]) REFERENCES [dbo].[accounts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[customers] ADD CONSTRAINT [customers_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[invoices] ADD CONSTRAINT [invoices_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[customers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[invoice_lines] ADD CONSTRAINT [invoice_lines_invoiceId_fkey] FOREIGN KEY ([invoiceId]) REFERENCES [dbo].[invoices]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [payments_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[invoices]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[suppliers] ADD CONSTRAINT [suppliers_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[companies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
