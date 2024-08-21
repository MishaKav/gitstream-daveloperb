module.exports = dummy => {
  const timestamp = new Date().toISOString();
  return JSON.stringify(timestamp);
};
