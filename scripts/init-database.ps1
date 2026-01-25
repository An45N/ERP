# Database Initialization Script for ERP Platform
# This script creates the ERP database and runs Prisma migrations

param(
    [string]$ServerHost = "localhost",
    [int]$Port = 1433,
    [string]$Username = "sa",
    [string]$Password = "StrongPass123",
    [string]$DatabaseName = "ERP"
)

Write-Host "=== ERP Database Initialization ===" -ForegroundColor Cyan
Write-Host ""

# Check if sqlcmd is available (via Docker container)
Write-Host "Checking SQL Server connection..." -ForegroundColor Yellow
$containerName = "erp-sqlserver"

try {
    $testQuery = docker exec $containerName /opt/mssql-tools18/bin/sqlcmd `
        -S localhost -U $Username -P $Password -C `
        -Q "SELECT @@VERSION" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connected to SQL Server" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to connect to SQL Server" -ForegroundColor Red
        Write-Host "Error: $testQuery" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ SQL Server container not found or not running" -ForegroundColor Red
    Write-Host "Please run setup-sqlserver.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Create database if it doesn't exist
Write-Host ""
Write-Host "Creating database '$DatabaseName'..." -ForegroundColor Yellow

$createDbScript = @"
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'$DatabaseName')
BEGIN
    CREATE DATABASE [$DatabaseName];
    PRINT 'Database created successfully';
END
ELSE
BEGIN
    PRINT 'Database already exists';
END
"@

$result = docker exec $containerName /opt/mssql-tools18/bin/sqlcmd `
    -S localhost -U $Username -P $Password -C `
    -Q $createDbScript 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database '$DatabaseName' ready" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create database" -ForegroundColor Red
    Write-Host "Error: $result" -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
$backendPath = Join-Path $PSScriptRoot "..\backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "✗ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath

# Generate Prisma client
Write-Host ""
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma client generated" -ForegroundColor Green

# Run migrations
Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to run migrations" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Migrations completed" -ForegroundColor Green

# Verify tables were created
Write-Host ""
Write-Host "Verifying database schema..." -ForegroundColor Yellow

$verifyScript = @"
USE [$DatabaseName];
SELECT 
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as ColumnCount
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
"@

$tables = docker exec $containerName /opt/mssql-tools18/bin/sqlcmd `
    -S localhost -U $Username -P $Password -C `
    -Q $verifyScript 2>&1

Write-Host ""
Write-Host "Database Tables:" -ForegroundColor White
Write-Host $tables -ForegroundColor Gray

# Summary
Write-Host ""
Write-Host "=== Database Initialization Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: $DatabaseName" -ForegroundColor White
Write-Host "Tables created:" -ForegroundColor White
Write-Host "  - tenants" -ForegroundColor Gray
Write-Host "  - companies" -ForegroundColor Gray
Write-Host "  - users" -ForegroundColor Gray
Write-Host "  - roles" -ForegroundColor Gray
Write-Host "  - user_roles" -ForegroundColor Gray
Write-Host "  - _prisma_migrations (internal)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Start the backend: npm run dev" -ForegroundColor White
Write-Host "  2. Start the frontend: cd ../frontend && npm run dev" -ForegroundColor White
Write-Host "  3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
