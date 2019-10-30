module.exports = {
  devServer: {
    proxy:  {
      '/api/upload': 'http://localhost:3001'
    }
  }
}
