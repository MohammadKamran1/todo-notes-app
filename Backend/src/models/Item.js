const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['todo', 'note'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false // only meaningful for todos
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
