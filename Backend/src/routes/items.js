const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Item = require('../models/Item');

const router = express.Router();

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
      const item = new Item({ type, title, content, completed });
      await item.save();
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }
);

// Read items (with optional filters)
router.get('/',
  query('type').optional().isIn(['todo', 'note']),
  query('completed').optional().isBoolean().toBoolean(),
  runValidation,
  async (req, res, next) => {
    try {
      const filter = {};
      if (req.query.type) filter.type = req.query.type;
      if (req.query.completed !== undefined) filter.completed = req.query.completed;
      const items = await Item.find(filter).sort({ createdAt: -1 }).lean();
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }
);

// Read single item
router.get('/:id',
  param('id').isMongoId(),
  runValidation,
  async (req, res, next) => {
    try {
      const item = await Item.findById(req.params.id);
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

// Update item
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

      const item = await Item.findByIdAndUpdate(req.params.id, updates, { new: true });
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

// Delete item
router.delete('/:id',
  param('id').isMongoId(),
  runValidation,
  async (req, res, next) => {
    try {
      const item = await Item.findByIdAndDelete(req.params.id);
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
