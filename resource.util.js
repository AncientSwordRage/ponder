const handleWriter = (writer) => new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
})

module.exports = {
    handleWriter
}