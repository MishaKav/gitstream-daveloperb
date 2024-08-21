module.exports = dummy => {
  const timestamp = new Date().toString();
  console.log(`Timestamp: ${timestamp}`);
  return timestamp;
};
