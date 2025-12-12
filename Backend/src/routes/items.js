// routes/items.js
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Item = require('../models/Item');
const auth = require('../middleware/auth');   // ← new

const router = express.Router();

// Apply auth to all /items routes
router.use(auth);

// Helper: central validation handler
const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.details = errors.array();
    return next(err);
  }
  next();
};

// Create item (todo or note)
router.post('/',
  body('type').isIn(['todo', 'note']),
  body('title').isString().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().isString().trim().isLength({ max: 2000 }),
  body('completed').optional().isBoolean(),
  runValidation,
  async (req, res, next) => {
    try {
      const { type, title, content, completed } = req.body;
      const item = new Item({
        type,
        title,
        content,
        completed,
        user: req.user.id              // <-- attach logged-in user
      });
      await item.save();
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }
);

// Read items (with optional filters) — only this user's items
router.get('/',
  query('type').optional().isIn(['todo', 'note']),
  query('completed').optional().isBoolean().toBoolean(),
  runValidation,
  async (req, res, next) => {
    try {
      const filter = { user: req.user.id }; // only user's items
      if (req.query.type) filter.type = req.query.type;
      if (req.query.completed !== undefined) filter.completed = req.query.completed;
      const items = await Item.find(filter).sort({ createdAt: -1 }).lean();
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }
);

// Read single item — only if it belongs to the user
router.get('/:id',
  param('id').isMongoId(),
  runValidation,
  async (req, res, next) => {
    try {
      const item = await Item.findOne({ _id: req.params.id, user: req.user.id });
      if (!item) {
        const err = new Error('Item not found');
        err.statusCode = 404;
        throw err;
      }
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }
);

// Update item — only if owned by the user
router.put('/:id',
  param('id').isMongoId(),
  body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().isString().trim().isLength({ max: 2000 }),
  body('completed').optional().isBoolean(),
  runValidation,
  async (req, res, next) => {
    try {
      const updates = {};
      ['title', 'content', 'completed'].forEach(k => {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      });

      const item = await Item.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        updates,
        { new: true }
      );

      if (!item) {
        const err = new Error('Item not found');
        err.statusCode = 404;
        throw err;
      }
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }
);

// Delete item — only if owned by the user
router.delete('/:id',
  param('id').isMongoId(),
  runValidation,
  async (req, res, next) => {
    try {
      const item = await Item.findOneAndDelete({ _id: req.params.id, user: req.user.id });
      if (!item) {
        const err = new Error('Item not found');
        err.statusCode = 404;
        throw err;
      }
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;