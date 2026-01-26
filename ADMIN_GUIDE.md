# ERP System Administrator Guide

## Overview

This guide is for system administrators responsible for setup, configuration, user management, and maintenance of the ERP system.

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [User Management](#user-management)
3. [Role-Based Access Control](#role-based-access-control)
4. [Company Management](#company-management)
5. [System Configuration](#system-configuration)
6. [Security](#security)
7. [Backup & Recovery](#backup--recovery)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance Tasks](#maintenance-tasks)

---

## Initial Setup

### System Requirements

**Server Requirements:**
- Node.js 18+ and npm
- PostgreSQL 14+ or SQL Server
- 2GB RAM minimum (4GB recommended)
- 10GB disk space minimum

**Client Requirements:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- 1280x720 minimum screen resolution

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/erp-system.git
   cd erp-system
   ```

2. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Configure Environment**
   ```bash
   # Backend
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Frontend
   cp .env.example .env
   # Edit .env with API URL
   ```

4. **Initialize Database**
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

5. **Start Services**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

6. **Access System**
   - Navigate to `http://localhost:5173`
   - Default admin credentials:
     - Email: `admin@example.com`
     - Password: `admin123`
   - **IMPORTANT:** Change default password immediately

---

## User Management

### Accessing Admin Panel

1. Login as administrator
2. Navigate to `/admin` or click "Admin Panel" in menu
3. Select "Users" from admin navigation

### Creating Users

1. Click "New User" button
2. Fill in user details:
   - **First Name** - User's first name
   - **Last Name** - User's last name
   - **Email** - Login email (must be unique)
   - **Password** - Initial password (user should change)
   - **Role** - Select user role
   - **Active** - Enable/disable user account
3. Click "Save"

### User Roles

**Admin**
- Full system access
- User management
- System configuration
- All financial operations

**Accountant**
- Full accounting access
- Create/edit transactions
- Generate reports
- Cannot manage users or system settings

**Viewer**
- Read-only access
- View reports
- View transactions
- Cannot create or edit data

### Editing Users

1. Find user in list
2. Click "Edit" button
3. Modify details
4. Click "Save"

### Deactivating Users

1. Edit user
2. Uncheck "Active" status
3. Click "Save"
4. User cannot login but data is preserved

### Resetting Passwords

1. Edit user
2. Enter new password
3. Check "Force password change on next login"
4. Click "Save"
5. Notify user of new password

---

## Role-Based Access Control

### Managing Roles

1. Navigate to Admin > Roles
2. View existing roles and permissions

### Creating Custom Roles

1. Click "New Role" button
2. Enter role details:
   - **Name** - Role name (e.g., "Sales Manager")
   - **Description** - Role purpose
3. Select permissions:
   - **Accounts** - View, Create, Edit, Delete
   - **Journal Entries** - View, Create, Edit, Delete
   - **Customers** - View, Create, Edit, Delete
   - **Suppliers** - View, Create, Edit, Delete
   - **Invoices** - View, Create, Edit, Delete, Send
   - **Bills** - View, Create, Edit, Delete, Pay
   - **Reports** - View, Export
   - **Settings** - View, Edit
4. Click "Save"

### Permission Matrix

| Feature | Admin | Accountant | Viewer |
|---------|-------|------------|--------|
| View Data | ✅ | ✅ | ✅ |
| Create/Edit | ✅ | ✅ | ❌ |
| Delete | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Reports | ✅ | ✅ | ✅ |

---

## Company Management

### Multi-Company Setup

1. Navigate to Admin > Companies
2. Click "New Company"
3. Enter company details:
   - **Name** - Company legal name
   - **Tax ID** - Tax identification number
   - **Address** - Physical address
   - **Currency** - Base currency
   - **Fiscal Year Start** - Month fiscal year begins
4. Click "Save"

### Switching Companies

Users with access to multiple companies:
1. Click company selector (top right)
2. Select company from dropdown
3. System switches context

### Company Settings

Each company has independent:
- Chart of accounts
- Customers and suppliers
- Transactions
- Reports
- Settings

---

## System Configuration

### General Settings

**Navigate to:** Admin > System Settings

**Configuration Options:**

1. **System Name**
   - Display name for the application
   - Appears in browser title and emails

2. **Date Format**
   - DD/MM/YYYY (European)
   - MM/DD/YYYY (US)
   - YYYY-MM-DD (ISO)

3. **Time Zone**
   - Set server timezone
   - Affects report timestamps

4. **Currency Format**
   - Decimal separator
   - Thousands separator
   - Currency symbol position

5. **Tax Settings**
   - Default tax rate
   - Tax calculation method
   - Tax rounding rules

### Email Configuration

**SMTP Settings:**
```
Host: smtp.gmail.com
Port: 587
Security: TLS
Username: your-email@gmail.com
Password: your-app-password
From Name: ERP System
From Email: noreply@yourerp.com
```

**Testing Email:**
1. Configure SMTP settings
2. Click "Send Test Email"
3. Check inbox for test message
4. Verify formatting and delivery

### Backup Configuration

**Automated Backups:**
1. Navigate to Admin > System Settings > Backups
2. Configure:
   - **Frequency** - Daily, Weekly, Monthly
   - **Time** - When to run backup
   - **Retention** - How long to keep backups
   - **Storage** - Local, S3, Azure Blob
3. Click "Save"

**Manual Backup:**
1. Click "Backup Now" button
2. Wait for completion
3. Download backup file
4. Store securely off-site

---

## Security

### Security Best Practices

1. **Strong Passwords**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - No dictionary words
   - Change every 90 days

2. **Two-Factor Authentication (2FA)**
   - Enable for all admin accounts
   - Require for sensitive operations
   - Use authenticator app

3. **IP Whitelisting**
   - Restrict admin panel to specific IPs
   - Use VPN for remote access
   - Monitor access logs

4. **Session Management**
   - Auto-logout after 30 minutes inactivity
   - Force logout on password change
   - Single session per user

5. **Data Encryption**
   - HTTPS enforced
   - Database encryption at rest
   - Encrypted backups

### Audit Logging

**Viewing Audit Logs:**
1. Navigate to Admin > Audit Logs
2. Filter by:
   - **Date Range**
   - **User**
   - **Action** (Create, Update, Delete)
   - **Entity** (Invoice, Customer, etc.)
3. Export logs for compliance

**What's Logged:**
- User login/logout
- Data creation/modification/deletion
- Permission changes
- System configuration changes
- Failed login attempts
- Export operations

### Security Monitoring

**Regular Checks:**
- [ ] Review failed login attempts weekly
- [ ] Check audit logs for suspicious activity
- [ ] Verify user access levels monthly
- [ ] Update system dependencies
- [ ] Review and rotate API keys
- [ ] Test backup restoration quarterly

---

## Backup & Recovery

### Backup Strategy

**Full Backup Schedule:**
- **Daily** - 2:00 AM local time
- **Weekly** - Sunday 1:00 AM
- **Monthly** - First Sunday of month

**What's Backed Up:**
- Database (all tables)
- File uploads (invoices, attachments)
- Configuration files
- User data

**Retention Policy:**
- Daily: 30 days
- Weekly: 90 days
- Monthly: 12 months
- Yearly: 7 years

### Backup Verification

**Monthly Test:**
1. Download latest backup
2. Restore to test environment
3. Verify data integrity
4. Test critical functions
5. Document results

### Disaster Recovery

**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 15 minutes

**Recovery Steps:**

1. **Assess Damage**
   - Identify what was lost
   - Determine recovery point

2. **Provision Infrastructure**
   - Set up new server if needed
   - Install dependencies

3. **Restore Database**
   ```bash
   pg_restore -U postgres -d erp_production backup.sql
   ```

4. **Restore Files**
   ```bash
   tar -xzf files_backup.tar.gz -C /var/www/erp/uploads/
   ```

5. **Verify System**
   - Test login
   - Check data integrity
   - Verify reports
   - Test transactions

6. **Update DNS**
   - Point domain to new server
   - Update SSL certificates

7. **Monitor**
   - Watch for errors
   - Check performance
   - Verify backups resume

---

## Monitoring

### System Health Dashboard

**Navigate to:** Admin > System Health

**Metrics Monitored:**
- **CPU Usage** - Server processor utilization
- **Memory Usage** - RAM consumption
- **Disk Space** - Storage capacity
- **Database Size** - Database growth
- **Active Users** - Current logged-in users
- **API Response Time** - Performance metrics

**Alert Thresholds:**
- CPU > 80% for 5 minutes
- Memory > 90%
- Disk Space < 10% free
- API Response > 2 seconds

### Performance Monitoring

**Key Performance Indicators:**
- Page load time < 2 seconds
- API response time < 500ms
- Database query time < 100ms
- Report generation < 5 seconds

**Optimization Tips:**
- Enable query caching
- Optimize database indexes
- Use CDN for static assets
- Implement lazy loading
- Compress images

### Error Monitoring

**Sentry Integration:**
1. Create Sentry account
2. Add DSN to environment variables
3. Errors automatically tracked
4. Set up alert rules
5. Review errors weekly

---

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Check database server is running
- Verify credentials in .env file
- Check firewall rules
- Test connection manually

**Email Not Sending**
- Verify SMTP settings
- Check email credentials
- Test with simple email client
- Review email logs

**Slow Performance**
- Check server resources
- Review database query performance
- Clear application cache
- Optimize large reports

**Users Can't Login**
- Verify account is active
- Check password is correct
- Review session configuration
- Check for IP restrictions

### Debug Mode

**Enable Debug Logging:**
```bash
# Backend .env
DEBUG=true
LOG_LEVEL=debug

# Restart server
npm run dev
```

**View Logs:**
```bash
# Application logs
tail -f logs/application.log

# Error logs
tail -f logs/error.log

# Access logs
tail -f logs/access.log
```

---

## Maintenance Tasks

### Daily Tasks
- [ ] Monitor system health dashboard
- [ ] Review error logs
- [ ] Check backup completion
- [ ] Verify critical services running

### Weekly Tasks
- [ ] Review audit logs
- [ ] Check disk space
- [ ] Update system dependencies
- [ ] Review user access
- [ ] Test backup restoration

### Monthly Tasks
- [ ] Security audit
- [ ] Performance review
- [ ] Update documentation
- [ ] Review and archive old data
- [ ] Test disaster recovery plan

### Quarterly Tasks
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review and update policies
- [ ] User access review
- [ ] System capacity planning

### Annual Tasks
- [ ] Major version upgrades
- [ ] Hardware refresh planning
- [ ] Compliance audit
- [ ] Disaster recovery drill
- [ ] Budget planning

---

## Support & Resources

### Getting Help

**Technical Support:**
- Email: admin-support@yourerp.com
- Phone: +230-XXXX-XXXX (24/7)
- Portal: https://support.yourerp.com

**Documentation:**
- User Manual: `USER_MANUAL.md`
- API Documentation: `API_DOCUMENTATION.md`
- Deployment Guide: `DEPLOYMENT_GUIDE.md`
- Testing Strategy: `TESTING_STRATEGY.md`

### Community

- GitHub: https://github.com/your-org/erp-system
- Forum: https://forum.yourerp.com
- Discord: https://discord.gg/yourerp

---

## Appendix

### Database Schema

See `backend/prisma/schema.prisma` for complete database schema.

### API Endpoints

See `API_DOCUMENTATION.md` for complete API reference.

### Environment Variables

See `.env.example` files for all configuration options.

---

**Last Updated:** January 26, 2026  
**Version:** 1.0  
**Next Review:** April 26, 2026

---

**© 2026 ERP System. All rights reserved.**
