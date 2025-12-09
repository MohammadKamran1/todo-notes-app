const express = require('express');
const router = express.Router();

const itemsRouter = require('./items');
router.use('/items', itemsRouter);

router.get('/', (req, res) => res.json({ ok: true, message: 'API is up' }));

module.exports = router;
