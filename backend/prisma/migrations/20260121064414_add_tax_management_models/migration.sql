BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[tax_rates] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(50) NOT NULL,
    [name] VARCHAR(255) NOT NULL,
    [rate] DECIMAL(5,2) NOT NULL,
    [taxType] VARCHAR(50) NOT NULL,
    [isDefault] BIT NOT NULL CONSTRAINT [tax_rates_isDefault_df] DEFAULT 0,
    [effectiveFrom] DATETIME2 NOT NULL,
    [effectiveTo] DATETIME2,
    [description] VARCHAR(500),
    [taxAccountId] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [tax_rates_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [tax_rates_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [tax_rates_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [tax_rates_tenantId_companyId_code_key] UNIQUE NONCLUSTERED ([tenantId],[companyId],[code])
);

-- CreateTable
CREATE TABLE [dbo].[tax_transactions] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [taxRateId] NVARCHAR(1000) NOT NULL,
    [transactionDate] DATETIME2 NOT NULL,
    [transactionType] VARCHAR(50) NOT NULL,
    [referenceType] VARCHAR(50),
    [referenceId] NVARCHAR(1000),
    [referenceNumber] VARCHAR(100),
    [baseAmount] DECIMAL(18,2) NOT NULL,
    [taxAmount] DECIMAL(18,2) NOT NULL,
    [totalAmount] DECIMAL(18,2) NOT NULL,
    [taxRate] DECIMAL(5,2) NOT NULL,
    [isReversed] BIT NOT NULL CONSTRAINT [tax_transactions_isReversed_df] DEFAULT 0,
    [reversedAt] DATETIME2,
    [journalEntryId] NVARCHAR(1000),
    [notes] VARCHAR(500),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [tax_transactions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [tax_transactions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tax_rates_tenantId_companyId_taxType_idx] ON [dbo].[tax_rates]([tenantId], [companyId], [taxType]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tax_rates_tenantId_companyId_effectiveFrom_idx] ON [dbo].[tax_rates]([tenantId], [companyId], [effectiveFrom]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tax_transactions_tenantId_companyId_taxRateId_idx] ON [dbo].[tax_transactions]([tenantId], [companyId], [taxRateId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tax_transactions_tenantId_companyId_transactionDate_idx] ON [dbo].[tax_transactions]([tenantId], [companyId], [transactionDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tax_transactions_tenantId_companyId_transactionType_idx] ON [dbo].[tax_transactions]([tenantId], [companyId], [transactionType]);

-- AddForeignKey
ALTER TABLE [dbo].[tax_rates] ADD CONSTRAINT [tax_rates_taxAccountId_fkey] FOREIGN KEY ([taxAccountId]) REFERENCES [dbo].[accounts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[tax_transactions] ADD CONSTRAINT [tax_transactions_taxRateId_fkey] FOREIGN KEY ([taxRateId]) REFERENCES [dbo].[tax_rates]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
