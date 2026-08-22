let mongoose = require('mongoose')

let schema = new mongoose.Schema({
  TelegramLink: {
    type: String,
    default: null,
    trim: true
  },
  YouTubeLink: {
    type: String,
    default: null,
    trim: true
  },
  InstagramLink: {
    type: String,
    default: null,
    trim: true
  },
  IsActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

schema.statics.getSettings = async function () {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({
      TelegramLink: null,
      YouTubeLink: null,
      InstagramLink: null,
      IsActive: true
    })
  }
  return settings
}

let SocialLinksSettings
try {
  SocialLinksSettings = mongoose.model('socialLinksSettings')
} catch (e) {
  SocialLinksSettings = mongoose.model('socialLinksSettings', schema)
}

module.exports = SocialLinksSettings
