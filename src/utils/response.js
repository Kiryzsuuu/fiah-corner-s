const send = (res, statusCode, success, message, data = null, meta = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

module.exports = {
  ok: (res, message, data, meta) => send(res, 200, true, message, data, meta),
  created: (res, message, data) => send(res, 201, true, message, data),
  badRequest: (res, message, data) => send(res, 400, false, message, data),
  unauthorized: (res, message) => send(res, 401, false, message),
  forbidden: (res, message) => send(res, 403, false, message),
  notFound: (res, message) => send(res, 404, false, message),
  error: (res, message, statusCode = 500, data) => send(res, statusCode, false, message, data),
};
