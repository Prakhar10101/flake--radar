class FlakeRadarReporter {
  onTestEnd(test, result) {
    if (result.status === "failed") {
      console.log("FLAKERADAR SAW A FAILURE:", test.title);
    }
  }
}

module.exports = FlakeRadarReporter;
