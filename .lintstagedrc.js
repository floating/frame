module.exports = {
  '**/*.{yml,json,md,html,ts,js}': (filenames) =>
    filenames.map((filename) => `prettier --check '${filename}'`)
}
