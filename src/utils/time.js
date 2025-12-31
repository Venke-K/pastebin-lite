function getNow(req) {
  console.log("INSIDE getNow(), TEST_MODE =", process.env.TEST_MODE);
  // Deterministic time for automated tests
  if (process.env.TEST_MODE === "1" && req.headers["x-test-now-ms"]) {
    return Number(req.headers["x-test-now-ms"]);
  }

  // Normal runtime
  return Date.now();
}

module.exports = { getNow };
