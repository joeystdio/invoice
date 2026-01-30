const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { pool } = require('../db');

router.get('/:id', async (req, res) => {
  const userId = req.user.id || req.user.user_id || req.user.sub;
  
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).send('Invoice not found');
    }
    
    const invoice = result.rows[0];
    const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(28).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
    doc.fontSize(12).font('Helvetica').text(invoice.invoice_number, { align: 'right' });
    doc.moveDown(2);
    
    // From/To section
    const userName = req.user.name || req.user.username || req.user.email || 'Freelancer';
    doc.fontSize(10).font('Helvetica-Bold').text('FROM');
    doc.font('Helvetica').text(userName);
    if (req.user.email) doc.text(req.user.email);
    doc.moveDown();
    
    doc.font('Helvetica-Bold').text('BILL TO');
    doc.font('Helvetica').text(invoice.client_name);
    if (invoice.client_email) doc.text(invoice.client_email);
    if (invoice.client_address) doc.text(invoice.client_address);
    doc.moveDown(2);
    
    // Dates
    const createdDate = new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Date: ${createdDate}`);
    if (invoice.due_date) {
      const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Due Date: ${dueDate}`);
    }
    doc.moveDown(2);
    
    // Items table header
    const tableTop = doc.y;
    const descX = 50;
    const qtyX = 300;
    const rateX = 380;
    const amountX = 470;
    
    doc.font('Helvetica-Bold');
    doc.text('Description', descX, tableTop);
    doc.text('Qty', qtyX, tableTop);
    doc.text('Rate', rateX, tableTop);
    doc.text('Amount', amountX, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    
    // Items
    let y = tableTop + 25;
    doc.font('Helvetica');
    
    items.forEach(item => {
      const amount = parseFloat(item.qty) * parseFloat(item.rate);
      doc.text(item.description, descX, y, { width: 240 });
      doc.text(item.qty.toString(), qtyX, y);
      doc.text(`€${parseFloat(item.rate).toFixed(2)}`, rateX, y);
      doc.text(`€${amount.toFixed(2)}`, amountX, y);
      y += 20;
    });
    
    // Totals
    y += 20;
    doc.moveTo(350, y).lineTo(550, y).stroke();
    y += 10;
    
    doc.text('Subtotal:', 380, y);
    doc.text(`€${parseFloat(invoice.subtotal).toFixed(2)}`, amountX, y);
    y += 20;
    
    if (parseFloat(invoice.tax_rate) > 0) {
      doc.text(`Tax (${invoice.tax_rate}%):`, 380, y);
      doc.text(`€${parseFloat(invoice.tax_amount).toFixed(2)}`, amountX, y);
      y += 20;
    }
    
    doc.font('Helvetica-Bold');
    doc.text('Total:', 380, y);
    doc.text(`€${parseFloat(invoice.total).toFixed(2)}`, amountX, y);
    
    // Notes
    if (invoice.notes) {
      y += 40;
      doc.font('Helvetica-Bold').text('Notes:', 50, y);
      doc.font('Helvetica').text(invoice.notes, 50, y + 15, { width: 500 });
    }
    
    // Footer
    doc.fontSize(9).text(
      'Thank you for your business!',
      50,
      doc.page.height - 50,
      { align: 'center', width: 500 }
    );
    
    doc.end();
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to generate PDF');
  }
});

module.exports = router;
