module.exports = dummy => {
  const timestamp = new Date().toISOString();
  console.log(`Timestamp: ${timestamp}`);
  return timestamp;
};
