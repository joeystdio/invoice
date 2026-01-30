const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// List all invoices for user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id || req.user.user_id || req.user.sub]
    );
    res.render('invoices/list', { invoices: result.rows, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Failed to load invoices' });
  }
});

// New invoice form
router.get('/new', (req, res) => {
  res.render('invoices/form', { invoice: null, user: req.user });
});

// Create invoice
router.post('/', async (req, res) => {
  const userId = req.user.id || req.user.user_id || req.user.sub;
  const { client_name, client_email, client_address, items, tax_rate, due_date, notes } = req.body;
  
  // Parse items if string
  const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
  
  // Calculate totals
  const subtotal = parsedItems.reduce((sum, item) => sum + (parseFloat(item.qty) * parseFloat(item.rate)), 0);
  const taxAmount = subtotal * (parseFloat(tax_rate || 0) / 100);
  const total = subtotal + taxAmount;
  
  // Generate invoice number
  const countResult = await pool.query('SELECT COUNT(*) FROM invoices WHERE user_id = $1', [userId]);
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;
  
  try {
    const result = await pool.query(
      `INSERT INTO invoices (user_id, invoice_number, client_name, client_email, client_address, items, subtotal, tax_rate, tax_amount, total, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [userId, invoiceNumber, client_name, client_email, client_address, JSON.stringify(parsedItems), subtotal, tax_rate || 0, taxAmount, total, due_date || null, notes]
    );
    res.redirect(`/invoices/${result.rows[0].id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Failed to create invoice' });
  }
});

// View single invoice
router.get('/:id', async (req, res) => {
  const userId = req.user.id || req.user.user_id || req.user.sub;
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).render('error', { message: 'Invoice not found' });
    }
    res.render('invoices/view', { invoice: result.rows[0], user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Failed to load invoice' });
  }
});

// Edit invoice form
router.get('/:id/edit', async (req, res) => {
  const userId = req.user.id || req.user.user_id || req.user.sub;
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).render('error', { message: 'Invoice not found' });
    }
    res.render('invoices/form', { invoice: result.rows[0], user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Failed to load invoice' });
  }
});

// Update invoice
router.post('/:id', async (req, res) => {
  const userId = req.user.id || req.user.user_id || req.user.sub;
  const { client_name, client_email, client_address, items, tax_rate, due_date, notes, status } = req.body;
  
  const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
  const subtotal = parsedItems.reduce((sum, item) => sum + (parseFloat(item.qty) * parseFloat(item.rate)), 0);
  const taxAmount = subtotal * (parseFloat(tax_rate || 0) / 100);
  const total = subtotal + taxAmount;
  
  try {
    await pool.query(
      `UPDATE invoices SET client_name = $1, client_email = $2, client_address = $3, items = $4, 
       subtotal = $5, tax_rate = $6, tax_amount = $7, total = $8, due_date = $9, notes = $10, 
       status = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 AND user_id = $13`,
      [client_name, client_email, client_address, JSON.stringify(parsedItems), subtotal, tax_rate || 0, taxAmount, total, due_date || null, notes, status || 'draft', req.params.id, userId]
    );
    res.redirect(`/invoices/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Failed to update invoice' });
  }
});

// Delete invoice
router.post('/:id/delete', async (req, res) => {
  const userId = req.user.id || req.user.user_id || req.user.sub;
  try {
    await pool.query('DELETE FROM invoices WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    res.redirect('/invoices');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Failed to delete invoice' });
  }
});

module.exports = router;
