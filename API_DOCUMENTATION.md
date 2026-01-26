# ERP System API Documentation

## Overview

RESTful API documentation for the ERP system backend.

**Base URL:** `https://api.yourerp.com`  
**Version:** 1.0  
**Authentication:** Bearer Token (JWT)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Accounts](#accounts)
3. [Journal Entries](#journal-entries)
4. [Customers](#customers)
5. [Suppliers](#suppliers)
6. [Invoices](#invoices)
7. [Bills](#bills)
8. [Reports](#reports)
9. [Users](#users)
10. [Error Handling](#error-handling)

---

## Authentication

### Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "Admin"
  }
}
```

### Logout

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Accounts

### List Accounts

**Endpoint:** `GET /accounts`

**Query Parameters:**
- `companyId` (required) - Company ID
- `type` (optional) - Filter by account type
- `search` (optional) - Search by code or name

**Response:**
```json
{
  "accounts": [
    {
      "id": "account-id",
      "code": "1000",
      "name": "Cash in Bank",
      "type": "Asset",
      "balance": 50000.00,
      "description": "Main bank account"
    }
  ]
}
```

### Create Account

**Endpoint:** `POST /accounts`

**Request Body:**
```json
{
  "companyId": "company-id",
  "code": "1000",
  "name": "Cash in Bank",
  "type": "Asset",
  "description": "Main bank account"
}
```

### Update Account

**Endpoint:** `PUT /accounts/:id`

### Delete Account

**Endpoint:** `DELETE /accounts/:id`

---

## Journal Entries

### List Journal Entries

**Endpoint:** `GET /journal-entries`

**Query Parameters:**
- `companyId` (required)
- `startDate` (optional)
- `endDate` (optional)
- `page` (optional, default: 1)
- `pageSize` (optional, default: 10)

**Response:**
```json
{
  "entries": [
    {
      "id": "entry-id",
      "date": "2024-01-15",
      "reference": "JE-001",
      "description": "Sale to customer",
      "lines": [
        {
          "accountId": "account-id",
          "accountName": "Cash",
          "debit": 10000.00,
          "credit": 0
        },
        {
          "accountId": "account-id",
          "accountName": "Sales Revenue",
          "debit": 0,
          "credit": 10000.00
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Create Journal Entry

**Endpoint:** `POST /journal-entries`

**Request Body:**
```json
{
  "companyId": "company-id",
  "date": "2024-01-15",
  "reference": "JE-001",
  "description": "Sale to customer",
  "lines": [
    {
      "accountId": "account-id",
      "debit": 10000.00,
      "credit": 0,
      "description": "Cash received"
    },
    {
      "accountId": "account-id",
      "debit": 0,
      "credit": 10000.00,
      "description": "Sales revenue"
    }
  ]
}
```

---

## Customers

### List Customers

**Endpoint:** `GET /customers`

**Response:**
```json
{
  "customers": [
    {
      "id": "customer-id",
      "name": "ABC Company",
      "email": "contact@abc.com",
      "phone": "+230-1234-5678",
      "address": "123 Main St",
      "taxId": "TAX123",
      "balance": 5000.00
    }
  ]
}
```

### Create Customer

**Endpoint:** `POST /customers`

**Request Body:**
```json
{
  "companyId": "company-id",
  "name": "ABC Company",
  "email": "contact@abc.com",
  "phone": "+230-1234-5678",
  "address": "123 Main St",
  "taxId": "TAX123"
}
```

---

## Invoices

### List Invoices

**Endpoint:** `GET /invoices`

**Query Parameters:**
- `companyId` (required)
- `status` (optional) - draft, sent, paid, overdue
- `customerId` (optional)
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "invoices": [
    {
      "id": "invoice-id",
      "invoiceNumber": "INV-001",
      "customerId": "customer-id",
      "customerName": "ABC Company",
      "date": "2024-01-15",
      "dueDate": "2024-02-15",
      "subtotal": 10000.00,
      "tax": 1500.00,
      "total": 11500.00,
      "status": "sent",
      "items": [
        {
          "description": "Consulting Services",
          "quantity": 10,
          "unitPrice": 1000.00,
          "amount": 10000.00
        }
      ]
    }
  ]
}
```

### Create Invoice

**Endpoint:** `POST /invoices`

**Request Body:**
```json
{
  "companyId": "company-id",
  "customerId": "customer-id",
  "date": "2024-01-15",
  "dueDate": "2024-02-15",
  "items": [
    {
      "description": "Consulting Services",
      "quantity": 10,
      "unitPrice": 1000.00
    }
  ],
  "taxRate": 15
}
```

### Send Invoice Email

**Endpoint:** `POST /invoices/:id/send-email`

**Request Body:**
```json
{
  "to": "customer@example.com",
  "cc": "accounting@example.com",
  "subject": "Invoice INV-001",
  "message": "Please find attached invoice.",
  "attachPdf": true
}
```

---

## Reports

### Generate Report

**Endpoint:** `GET /reports/:reportType`

**Report Types:**
- `general-ledger`
- `trial-balance`
- `balance-sheet`
- `income-statement`
- `ar-aging`
- `ap-aging`
- `vat-return`
- `customer-statement`

**Query Parameters:**
- `companyId` (required)
- `startDate` (required for most reports)
- `endDate` (required for most reports)
- `accountId` (optional, for general-ledger)
- `customerId` (optional, for customer-statement)

**Response:**
```json
{
  "reportType": "income-statement",
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "data": {
    "revenue": {
      "total": 100000.00,
      "accounts": [...]
    },
    "expenses": {
      "total": 60000.00,
      "accounts": [...]
    },
    "netIncome": 40000.00
  }
}
```

---

## Users

### List Users

**Endpoint:** `GET /users`

**Response:**
```json
{
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Accountant",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create User

**Endpoint:** `POST /users`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "Accountant"
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Common Error Codes

- `AUTHENTICATION_FAILED` - Invalid credentials
- `TOKEN_EXPIRED` - JWT token expired
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `PERMISSION_DENIED` - Insufficient permissions
- `DUPLICATE_ENTRY` - Resource already exists

---

## Rate Limiting

- **Rate Limit:** 100 requests per minute per IP
- **Headers:**
  - `X-RateLimit-Limit` - Request limit
  - `X-RateLimit-Remaining` - Remaining requests
  - `X-RateLimit-Reset` - Reset timestamp

---

## Webhooks

### Available Events

- `invoice.created`
- `invoice.paid`
- `customer.created`
- `payment.received`

### Webhook Payload

```json
{
  "event": "invoice.paid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "invoiceId": "invoice-id",
    "amount": 11500.00
  }
}
```

---

## SDK & Libraries

### JavaScript/TypeScript

```bash
npm install @yourerp/sdk
```

```typescript
import { ERPClient } from '@yourerp/sdk';

const client = new ERPClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.yourerp.com'
});

const invoices = await client.invoices.list({
  companyId: 'company-id'
});
```

---

**Last Updated:** January 26, 2026  
**API Version:** 1.0

---

**© 2026 ERP System. All rights reserved.**
