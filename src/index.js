require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./db');
const authMiddleware = require('./middleware/auth');
const invoiceRoutes = require('./routes/invoices');
const pdfRoutes = require('./routes/pdf');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Auth middleware for all routes except health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(authMiddleware);

// Routes
app.use('/invoices', invoiceRoutes);
app.use('/pdf', pdfRoutes);

// Home - redirect to invoices
app.get('/', (req, res) => res.redirect('/invoices'));

// Initialize database and start server
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`Invoice app running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
