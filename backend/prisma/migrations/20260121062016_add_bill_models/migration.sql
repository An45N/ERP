/*
  Warnings:

  - You are about to drop the column `customerId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `payments` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[payments] DROP CONSTRAINT [payments_customerId_fkey];

-- DropIndex
DROP INDEX [payments_tenantId_companyId_customerId_idx] ON [dbo].[payments];

-- DropIndex
DROP INDEX [payments_tenantId_companyId_supplierId_idx] ON [dbo].[payments];

-- AlterTable
ALTER TABLE [dbo].[payments] DROP COLUMN [customerId],
[supplierId];
ALTER TABLE [dbo].[payments] ADD [billId] NVARCHAR(1000),
[invoiceId] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[bills] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [supplierId] NVARCHAR(1000) NOT NULL,
    [billNumber] VARCHAR(50) NOT NULL,
    [billDate] DATETIME2 NOT NULL,
    [dueDate] DATETIME2 NOT NULL,
    [reference] VARCHAR(100),
    [description] VARCHAR(500),
    [subtotal] DECIMAL(18,2) NOT NULL CONSTRAINT [bills_subtotal_df] DEFAULT 0,
    [taxAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [bills_taxAmount_df] DEFAULT 0,
    [totalAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [bills_totalAmount_df] DEFAULT 0,
    [paidAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [bills_paidAmount_df] DEFAULT 0,
    [currency] VARCHAR(3) NOT NULL CONSTRAINT [bills_currency_df] DEFAULT 'MUR',
    [status] VARCHAR(20) NOT NULL CONSTRAINT [bills_status_df] DEFAULT 'DRAFT',
    [notes] VARCHAR(1000),
    [journalEntryId] NVARCHAR(1000),
    [createdBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [bills_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [bills_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [bills_tenantId_companyId_billNumber_key] UNIQUE NONCLUSTERED ([tenantId],[companyId],[billNumber])
);

-- CreateTable
CREATE TABLE [dbo].[bill_lines] (
    [id] NVARCHAR(1000) NOT NULL,
    [billId] NVARCHAR(1000) NOT NULL,
    [lineNumber] INT NOT NULL,
    [description] VARCHAR(500) NOT NULL,
    [quantity] DECIMAL(18,4) NOT NULL CONSTRAINT [bill_lines_quantity_df] DEFAULT 1,
    [unitPrice] DECIMAL(18,2) NOT NULL CONSTRAINT [bill_lines_unitPrice_df] DEFAULT 0,
    [taxRate] DECIMAL(5,2) NOT NULL CONSTRAINT [bill_lines_taxRate_df] DEFAULT 0,
    [taxAmount] DECIMAL(18,2) NOT NULL CONSTRAINT [bill_lines_taxAmount_df] DEFAULT 0,
    [lineTotal] DECIMAL(18,2) NOT NULL CONSTRAINT [bill_lines_lineTotal_df] DEFAULT 0,
    [accountId] NVARCHAR(1000),
    CONSTRAINT [bill_lines_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [bill_lines_billId_lineNumber_key] UNIQUE NONCLUSTERED ([billId],[lineNumber])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bills_tenantId_companyId_supplierId_idx] ON [dbo].[bills]([tenantId], [companyId], [supplierId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bills_tenantId_companyId_status_idx] ON [dbo].[bills]([tenantId], [companyId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bills_tenantId_companyId_billDate_idx] ON [dbo].[bills]([tenantId], [companyId], [billDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [payments_tenantId_companyId_invoiceId_idx] ON [dbo].[payments]([tenantId], [companyId], [invoiceId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [payments_tenantId_companyId_billId_idx] ON [dbo].[payments]([tenantId], [companyId], [billId]);

-- AddForeignKey
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [payments_invoiceId_fkey] FOREIGN KEY ([invoiceId]) REFERENCES [dbo].[invoices]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [payments_billId_fkey] FOREIGN KEY ([billId]) REFERENCES [dbo].[bills]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[bills] ADD CONSTRAINT [bills_supplierId_fkey] FOREIGN KEY ([supplierId]) REFERENCES [dbo].[suppliers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[bill_lines] ADD CONSTRAINT [bill_lines_billId_fkey] FOREIGN KEY ([billId]) REFERENCES [dbo].[bills]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
