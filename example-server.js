// Just a backend for testing:
// Saves uploaded files to the upload directory
const { send } = require('micro')
const { upload, move } = require('micro-upload')
const { join } = require('path')

module.exports = upload(async (req, res) => {
  if (!req.files) {
    return send(res, 400, 'no file uploaded')
  }
 
  let file = req.files.file
  await move(file, join(__dirname, `/uploads/${file.name.replace(/\s/, '-')}`))
  send(res, 200, 'upload success')
})
