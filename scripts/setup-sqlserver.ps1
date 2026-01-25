# SQL Server Setup Script for ERP Platform
# This script provisions a SQL Server instance using Docker

param(
    [string]$Password = "StrongPass123",
    [int]$Port = 1433,
    [string]$ContainerName = "erp-sqlserver"
)

Write-Host "=== ERP SQL Server Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if container already exists
Write-Host "Checking for existing container..." -ForegroundColor Yellow
$existingContainer = docker ps -a --filter "name=$ContainerName" --format "{{.Names}}"
if ($existingContainer -eq $ContainerName) {
    Write-Host "! Container '$ContainerName' already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to remove it and create a new one? (y/n)"
    if ($response -eq "y") {
        Write-Host "Stopping and removing existing container..." -ForegroundColor Yellow
        docker stop $ContainerName | Out-Null
        docker rm $ContainerName | Out-Null
        Write-Host "✓ Existing container removed" -ForegroundColor Green
    } else {
        Write-Host "Keeping existing container. Exiting..." -ForegroundColor Yellow
        exit 0
    }
}

# Pull SQL Server image
Write-Host ""
Write-Host "Pulling SQL Server 2022 image..." -ForegroundColor Yellow
docker pull mcr.microsoft.com/mssql/server:2022-latest

# Create and start SQL Server container
Write-Host ""
Write-Host "Creating SQL Server container..." -ForegroundColor Yellow
docker run -e "ACCEPT_EULA=Y" `
    -e "SA_PASSWORD=$Password" `
    -e "MSSQL_PID=Developer" `
    -p ${Port}:1433 `
    --name $ContainerName `
    -d mcr.microsoft.com/mssql/server:2022-latest

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SQL Server container created successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create SQL Server container" -ForegroundColor Red
    exit 1
}

# Wait for SQL Server to be ready
Write-Host ""
Write-Host "Waiting for SQL Server to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    $attempt++
    
    $status = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd `
        -S localhost -U sa -P $Password -C `
        -Q "SELECT 1" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        Write-Host "✓ SQL Server is ready!" -ForegroundColor Green
    } else {
        Write-Host "  Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    }
}

if (-not $ready) {
    Write-Host "✗ SQL Server failed to start within timeout" -ForegroundColor Red
    exit 1
}

# Update .env file
Write-Host ""
Write-Host "Updating .env file..." -ForegroundColor Yellow
$envPath = Join-Path $PSScriptRoot "..\backend\.env"
# Use JDBC-style connection string for Prisma 7 compatibility
$connectionString = "DATABASE_URL=`"sqlserver://localhost:${Port};database=ERP;user=sa;password=${Password};trustServerCertificate=true;encrypt=false`""

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $newContent = $envContent | ForEach-Object {
        if ($_ -match "^DATABASE_URL=") {
            $connectionString
        } else {
            $_
        }
    }
    $newContent | Set-Content $envPath
    Write-Host "✓ .env file updated" -ForegroundColor Green
} else {
    Write-Host "! .env file not found, creating from .env.example..." -ForegroundColor Yellow
    $envExamplePath = Join-Path $PSScriptRoot "..\backend\.env.example"
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        $envContent = Get-Content $envPath
        $newContent = $envContent | ForEach-Object {
            if ($_ -match "^DATABASE_URL=") {
                $connectionString
            } else {
                $_
            }
        }
        $newContent | Set-Content $envPath
        Write-Host "✓ .env file created and updated" -ForegroundColor Green
    } else {
        Write-Host "✗ .env.example not found" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "SQL Server Details:" -ForegroundColor White
Write-Host "  Container Name: $ContainerName" -ForegroundColor Gray
Write-Host "  Host: localhost" -ForegroundColor Gray
Write-Host "  Port: $Port" -ForegroundColor Gray
Write-Host "  Username: sa" -ForegroundColor Gray
Write-Host "  Password: $Password" -ForegroundColor Gray
Write-Host ""
Write-Host "Connection String:" -ForegroundColor White
Write-Host "  sqlserver://localhost:${Port};database=ERP;user=sa;password=${Password};trustServerCertificate=true;encrypt=false" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. cd backend" -ForegroundColor White
Write-Host "  2. npm run prisma:generate" -ForegroundColor White
Write-Host "  3. npx prisma migrate dev --name init" -ForegroundColor White
Write-Host "  4. npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To stop SQL Server:" -ForegroundColor Yellow
Write-Host "  docker stop $ContainerName" -ForegroundColor White
Write-Host ""
Write-Host "To start SQL Server:" -ForegroundColor Yellow
Write-Host "  docker start $ContainerName" -ForegroundColor White
Write-Host ""
