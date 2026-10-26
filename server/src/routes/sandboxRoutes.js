import express from 'express';

const router = express.Router();

// In-memory state for sandbox playground
let sandboxState = {
  productName: 'Quantum Pro HyperBook 16"',
  price: '₹1,49,900.00',
  stockStatus: 'In Stock (18 units available)',
  badge: 'Best Seller',
  headline: 'Special Spring Tech Clearance - Free Worldwide Shipping',
  lastModified: new Date().toISOString(),
  revision: 1,
};

// @route   GET /api/sandbox/page
// @desc    Returns an HTML page that can be scraped and monitored
router.get('/page', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${sandboxState.productName} - Official TechStore</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
        .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }
        .tag { display: inline-block; background: #4f46e5; color: #fff; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: bold; }
        h1 { margin-top: 16px; font-size: 26px; }
        .price-box { background: #0b1120; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #1e293b; }
        .price { font-size: 36px; font-weight: 800; color: #34d399; }
        .stock { font-size: 15px; color: #94a3b8; margin-top: 8px; }
        .announcement { background: rgba(99, 102, 241, 0.15); border-left: 4px solid #6366f1; padding: 14px; border-radius: 0 8px 8px 0; font-size: 14px; }
        .footer { margin-top: 24px; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="tag" id="badge">${sandboxState.badge}</span>
        <h1 id="title">${sandboxState.productName}</h1>
        
        <div class="announcement" id="banner">
          ${sandboxState.headline}
        </div>

        <div class="price-box" id="price-card">
          <div class="price" id="price">${sandboxState.price}</div>
          <div class="stock" id="stock">${sandboxState.stockStatus}</div>
        </div>

        <p id="specs">
          Processor: NeuralCore X9 (16 Cores)<br>
          RAM: 32GB Unified Memory<br>
          Storage: 1TB NVMe Gen4 SSD<br>
          Display: 16-inch Liquid Retina 120Hz ProMotion
        </p>

        <div class="footer">
          Revision: v${sandboxState.revision} • Last System Update: ${sandboxState.lastModified}
        </div>
      </div>
    </body>
    </html>
  `);
});

// @route   GET /api/sandbox/state
// @desc    Get current sandbox state
router.get('/state', (req, res) => {
  res.json({ success: true, state: sandboxState });
});

// @route   POST /api/sandbox/simulate-change
// @desc    Simulate changes to the sandbox page
router.post('/simulate-change', (req, res) => {
  const { action, customPrice, customHeadline, customStock } = req.body;

  sandboxState.revision += 1;
  sandboxState.lastModified = new Date().toISOString();

  if (action === 'price_drop') {
    sandboxState.price = '₹1,19,900.00 (Save ₹30,000!)';
    sandboxState.badge = 'FLASH DEAL';
    sandboxState.stockStatus = 'Limited Quantity (Only 3 left in stock!)';
    sandboxState.headline = 'Flash Deal: Extra 10% off with coupon FLASH10';
  } else if (action === 'out_of_stock') {
    sandboxState.price = '₹1,49,900.00';
    sandboxState.badge = 'Sold Out';
    sandboxState.stockStatus = 'Currently Out of Stock. Expected in 2 weeks.';
    sandboxState.headline = 'Notice: New inventory arriving shortly.';
  } else if (action === 'reset') {
    sandboxState = {
      productName: 'Quantum Pro HyperBook 16"',
      price: '₹1,49,900.00',
      stockStatus: 'In Stock (18 units available)',
      badge: 'Best Seller',
      headline: 'Special Spring Tech Clearance - Free Worldwide Shipping',
      lastModified: new Date().toISOString(),
      revision: 1,
    };
  } else {
    // Custom update
    if (customPrice) sandboxState.price = customPrice;
    if (customHeadline) sandboxState.headline = customHeadline;
    if (customStock) sandboxState.stockStatus = customStock;
  }

  res.json({
    success: true,
    message: 'Sandbox target updated successfully! Click "Check Now" in your monitor to detect the change.',
    state: sandboxState,
  });
});

export default router;
