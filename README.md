# Invoice Generator

Simple invoice generator for freelancers with SSO authentication.

## Features

- 🔐 SSO authentication via auth.jdms.nl
- 📝 Create and manage invoices
- 💰 Auto-calculate totals with tax support
- 📄 PDF generation and download
- 🎨 Clean, professional UI with Tailwind CSS

## Tech Stack

- Node.js + Express
- PostgreSQL
- EJS templates
- PDFKit for PDF generation
- Tailwind CSS (CDN)

## Deployment

```bash
docker-compose up -d --build
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_PASSWORD` - Database password

## Routes

- `GET /` - Redirect to invoices
- `GET /invoices` - List all invoices
- `GET /invoices/new` - New invoice form
- `POST /invoices` - Create invoice
- `GET /invoices/:id` - View invoice
- `GET /invoices/:id/edit` - Edit invoice form
- `POST /invoices/:id` - Update invoice
- `POST /invoices/:id/delete` - Delete invoice
- `GET /pdf/:id` - Download invoice PDF
- `GET /health` - Health check (no auth)
