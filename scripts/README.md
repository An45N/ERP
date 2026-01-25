# ERP Database Setup Scripts

This directory contains PowerShell scripts to set up SQL Server and initialize the ERP database.

## Prerequisites

- **Docker Desktop** installed and running
- **PowerShell 7+** (recommended)
- **Node.js 18+** and npm

## Scripts

### 1. `setup-sqlserver.ps1`

Provisions a SQL Server 2022 instance using Docker.

**Usage:**
```powershell
cd scripts
.\setup-sqlserver.ps1
```

**Optional Parameters:**
```powershell
.\setup-sqlserver.ps1 -Password "YourPassword123!" -Port 1433 -ContainerName "erp-sqlserver"
```

**What it does:**
- Checks Docker installation and status
- Pulls SQL Server 2022 Docker image
- Creates and starts a SQL Server container
- Waits for SQL Server to be ready
- Updates `backend/.env` with the connection string

**Default Configuration:**
- Container Name: `erp-sqlserver`
- Port: `1433`
- Username: `sa`
- Password: `StrongPass123`

### 2. `init-database.ps1`

Creates the ERP database and runs Prisma migrations.

**Usage:**
```powershell
cd scripts
.\init-database.ps1
```

**Optional Parameters:**
```powershell
.\init-database.ps1 -ServerHost "localhost" -Port 1433 -Username "sa" -Password "StrongPassword!1" -DatabaseName "ERP"
```

**What it does:**
- Connects to SQL Server container
- Creates the `ERP` database if it doesn't exist
- Generates Prisma client
- Runs database migrations
- Creates tables: `tenants`, `companies`, `users`, `roles`, `user_roles`
- Verifies schema creation

## Quick Start

Run both scripts in sequence:

```powershell
# 1. Set up SQL Server
cd d:\01.Dev\ERP\scripts
.\setup-sqlserver.ps1

# 2. Initialize database
.\init-database.ps1

# 3. Start the backend
cd ..\backend
npm run dev

# 4. Start the frontend (in another terminal)
cd ..\frontend
npm run dev
```

## Managing SQL Server

### Start SQL Server
```powershell
docker start erp-sqlserver
```

### Stop SQL Server
```powershell
docker stop erp-sqlserver
```

### View SQL Server logs
```powershell
docker logs erp-sqlserver
```

### Connect to SQL Server (via Docker)
```powershell
docker exec -it erp-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "StrongPassword!1" -C
```

### Remove SQL Server container
```powershell
docker stop erp-sqlserver
docker rm erp-sqlserver
```

## Troubleshooting

### Docker not running
**Error:** `Docker is not running`  
**Solution:** Start Docker Desktop and wait for it to be ready.

### Port already in use
**Error:** `port is already allocated`  
**Solution:** Either stop the service using port 1433 or use a different port:
```powershell
.\setup-sqlserver.ps1 -Port 1434
```
Then update `backend/.env` accordingly.

### SQL Server not ready
**Error:** `SQL Server failed to start within timeout`  
**Solution:** 
- Check Docker logs: `docker logs erp-sqlserver`
- Ensure Docker has enough resources (Settings → Resources)
- Try removing and recreating the container

### Migration fails
**Error:** `P1013: The provided database string is invalid`  
**Solution:** 
- Verify `backend/.env` has the correct `DATABASE_URL`
- Ensure SQL Server is running: `docker ps | grep erp-sqlserver`
- Test connection manually using the Docker exec command above

### Password requirements
SQL Server requires strong passwords with:
- At least 8 characters
- Uppercase and lowercase letters
- Numbers
- Special characters

## Connection String Format

Prisma 7 requires JDBC-style connection strings for SQL Server:

```
sqlserver://localhost:1433;database=ERP;user=sa;password=PASSWORD;trustServerCertificate=true;encrypt=false
```

**Parameters:**
- `database=ERP` - Database name
- `user=sa` - SQL Server username
- `password=PASSWORD` - SQL Server password
- `trustServerCertificate=true` - Accept self-signed certificates (dev only)
- `encrypt=false` - Disable encryption (dev only; use `true` in production)

**Note:** Use semicolons (`;`) to separate parameters, not ampersands (`&`)

## Production Considerations

For production deployments:
- Use a managed SQL Server instance (Azure SQL, AWS RDS, etc.)
- Enable encryption (`encrypt=true`)
- Use proper SSL certificates
- Store credentials in a secret manager (Azure Key Vault, AWS Secrets Manager)
- Use SQL authentication with strong, rotated passwords
- Implement network security groups and firewall rules
- Enable SQL Server auditing and monitoring

## Next Steps

After running the setup scripts:
1. Review the Prisma schema in `backend/prisma/schema.prisma`
2. Add seed data if needed: `npx prisma db seed`
3. Start building business logic in `backend/src/`
4. Follow the roadmap in `cahier_des_charges_erp_type_sap.md`
