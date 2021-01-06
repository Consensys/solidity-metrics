'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */

/*
Example:

const {SolidityMetricsContainer} = require('solidity-metrics');

let metrics = new SolidityMetricsContainer("containerName", {
        basePath:"",
        initDoppelGanger: undefined,
        inputFileGlobExclusions:undefined,
        inputFileGlob: undefined,
        inputFileGlobLimit: undefined,
        debug:false,
        repoInfo: {
            branch: undefined,
            commit: undefined,
            remote: undefined
        }
    });

    // analyze files
    metrics.analyze(path_to_solidity_file);
    // ...
    metrics.analyze(path_to_solidity_file_N);

    // output
    console.log(metrics.totals());
    console.log(metrics.generateReportMarkdown());
 */

const {SolidityMetricsContainer} = require('./metrics/metrics');

module.exports = {
    SolidityMetricsContainer
};
