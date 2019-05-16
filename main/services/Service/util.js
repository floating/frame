const fs = require('fs')
const path = require('path')

exports.mkdirP = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
}

exports.rmRF = (dir) => {
  // If directory exists ->
  if (fs.existsSync(dir)) {
    // Get files from directory
    fs.readdirSync(dir)
      // Add absolute path
      .map((file) => path.resolve(dir, file))
      // Unlink each file
      .forEach((file) => fs.unlinkSync(file))

    // Remove directory
    fs.rmdirSync(dir)
  }
}
