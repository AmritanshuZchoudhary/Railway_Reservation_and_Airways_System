function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, _req, res, _next) {
  console.error('[api-error]', error.message);
  if (res.headersSent) return;
  if (error.code === 'ER_NO_SUCH_TABLE') {
    return res.status(503).json({ error: 'The database schema is not installed yet. Follow the SQL setup order in README.md.' });
  }
  if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({ error: 'Could not connect to MySQL. Check that MySQL Server is running and backend/.env is correct.' });
  }
  return res.status(500).json({ error: 'Something went wrong on the server. Check the backend terminal for details.' });
}
module.exports = { notFound, errorHandler };
