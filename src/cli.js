#!/usr/bin/env node
'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */


const {SolidityMetricsContainer} = require('./metrics/metrics');

let metrics = new SolidityMetricsContainer("containerName", {
    basePath:"",
    initDoppelGanger: undefined,
    inputFileGlobExclusions: undefined,
    inputFileGlob: undefined,
    inputFileGlobLimit: undefined,
    debug:false,
    repoInfo: {
        branch: undefined,
        commit: undefined,
        remote: undefined
    }
});

process.argv.slice(1,).forEach(f => {
    if(f.endsWith(".sol")){
        // analyze files
        metrics.analyze(f);
    } 
});

// output
//console.log(metrics.totals());
metrics.generateReportMarkdown().then(text => console.log(text));
