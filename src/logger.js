let verbose = false;

function setVerbose(v) {
    verbose = v;
}

function verboseLog(message) {
    if (verbose) {
        console.log(message);
    }
}

module.exports = { verboseLog, setVerbose };
