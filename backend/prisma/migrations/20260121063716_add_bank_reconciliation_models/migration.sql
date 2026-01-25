BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[bank_accounts] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [accountNumber] VARCHAR(50) NOT NULL,
    [accountName] VARCHAR(255) NOT NULL,
    [bankName] VARCHAR(255) NOT NULL,
    [bankBranch] VARCHAR(255),
    [currency] VARCHAR(3) NOT NULL CONSTRAINT [bank_accounts_currency_df] DEFAULT 'MUR',
    [accountType] VARCHAR(50) NOT NULL,
    [glAccountId] NVARCHAR(1000) NOT NULL,
    [openingBalance] DECIMAL(18,2) NOT NULL CONSTRAINT [bank_accounts_openingBalance_df] DEFAULT 0,
    [currentBalance] DECIMAL(18,2) NOT NULL CONSTRAINT [bank_accounts_currentBalance_df] DEFAULT 0,
    [lastReconciledAt] DATETIME2,
    [lastReconciledBalance] DECIMAL(18,2),
    [isActive] BIT NOT NULL CONSTRAINT [bank_accounts_isActive_df] DEFAULT 1,
    [notes] VARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [bank_accounts_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [bank_accounts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [bank_accounts_tenantId_companyId_accountNumber_key] UNIQUE NONCLUSTERED ([tenantId],[companyId],[accountNumber])
);

-- CreateTable
CREATE TABLE [dbo].[bank_transactions] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [bankAccountId] NVARCHAR(1000) NOT NULL,
    [transactionDate] DATETIME2 NOT NULL,
    [valueDate] DATETIME2,
    [description] VARCHAR(500) NOT NULL,
    [reference] VARCHAR(100),
    [debit] DECIMAL(18,2) NOT NULL CONSTRAINT [bank_transactions_debit_df] DEFAULT 0,
    [credit] DECIMAL(18,2) NOT NULL CONSTRAINT [bank_transactions_credit_df] DEFAULT 0,
    [balance] DECIMAL(18,2),
    [isReconciled] BIT NOT NULL CONSTRAINT [bank_transactions_isReconciled_df] DEFAULT 0,
    [reconciledAt] DATETIME2,
    [reconciliationId] NVARCHAR(1000),
    [journalEntryId] NVARCHAR(1000),
    [notes] VARCHAR(1000),
    [importBatch] VARCHAR(100),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [bank_transactions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [bank_transactions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[bank_reconciliations] (
    [id] NVARCHAR(1000) NOT NULL,
    [tenantId] NVARCHAR(1000) NOT NULL,
    [companyId] NVARCHAR(1000) NOT NULL,
    [bankAccountId] NVARCHAR(1000) NOT NULL,
    [reconciliationDate] DATETIME2 NOT NULL,
    [statementDate] DATETIME2 NOT NULL,
    [statementBalance] DECIMAL(18,2) NOT NULL,
    [glBalance] DECIMAL(18,2) NOT NULL,
    [adjustedGLBalance] DECIMAL(18,2) NOT NULL,
    [difference] DECIMAL(18,2) NOT NULL,
    [status] VARCHAR(20) NOT NULL CONSTRAINT [bank_reconciliations_status_df] DEFAULT 'IN_PROGRESS',
    [notes] VARCHAR(1000),
    [reconciledBy] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [bank_reconciliations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [bank_reconciliations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bank_accounts_tenantId_companyId_idx] ON [dbo].[bank_accounts]([tenantId], [companyId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bank_transactions_tenantId_companyId_bankAccountId_idx] ON [dbo].[bank_transactions]([tenantId], [companyId], [bankAccountId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bank_transactions_tenantId_companyId_transactionDate_idx] ON [dbo].[bank_transactions]([tenantId], [companyId], [transactionDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bank_transactions_tenantId_companyId_isReconciled_idx] ON [dbo].[bank_transactions]([tenantId], [companyId], [isReconciled]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bank_reconciliations_tenantId_companyId_bankAccountId_idx] ON [dbo].[bank_reconciliations]([tenantId], [companyId], [bankAccountId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bank_reconciliations_tenantId_companyId_reconciliationDate_idx] ON [dbo].[bank_reconciliations]([tenantId], [companyId], [reconciliationDate]);

-- AddForeignKey
ALTER TABLE [dbo].[bank_accounts] ADD CONSTRAINT [bank_accounts_glAccountId_fkey] FOREIGN KEY ([glAccountId]) REFERENCES [dbo].[accounts]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[bank_transactions] ADD CONSTRAINT [bank_transactions_bankAccountId_fkey] FOREIGN KEY ([bankAccountId]) REFERENCES [dbo].[bank_accounts]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[bank_transactions] ADD CONSTRAINT [bank_transactions_reconciliationId_fkey] FOREIGN KEY ([reconciliationId]) REFERENCES [dbo].[bank_reconciliations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[bank_reconciliations] ADD CONSTRAINT [bank_reconciliations_bankAccountId_fkey] FOREIGN KEY ([bankAccountId]) REFERENCES [dbo].[bank_accounts]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
