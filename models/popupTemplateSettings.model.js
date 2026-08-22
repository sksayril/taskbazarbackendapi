let mongoose = require('mongoose')

let schema = new mongoose.Schema({
  Title: {
    type: String,
    default: '',
    trim: true
  },
  /** Main message body for the popup. */
  Description: {
    type: String,
    default: '',
    trim: true
  },
  /** @deprecated Stored only so older documents can still be read until re-saved via admin. Cleared on new saves. */
  Body: {
    type: String,
    default: '',
    trim: true
  },
  IsActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

/** Single template row; created when admin saves (no auto-insert). */
schema.statics.getSettings = async function () {
  return this.findOne()
}

module.exports = mongoose.model('popupTemplateSettings', schema)
