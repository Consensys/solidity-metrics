#!/usr/bin/env node
'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */

const glob = require("glob");
const {SolidityMetricsContainer} = require('./metrics/metrics');
const {exportAsHtml} = require('./metrics/helper');


let metrics = new SolidityMetricsContainer("'CLI'", {
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

let options = [];

process.argv.slice(1,).forEach(f => {
    if(f.startsWith("--")){
        options.push(f);
    } else if(f.endsWith(".sol")){
        // analyze files
        glob.sync(f).forEach(fg => metrics.analyze(fg));
    } 
});

// output
//console.log(metrics.totals());
let dotGraphs = {};
try {
    dotGraphs = metrics.getDotGraphs();
} catch (error) {
    console.log(error);
}

metrics.generateReportMarkdown().then(md => {
    
    if(options.includes("--html")){
        console.log(exportAsHtml(md, metrics.totals(), dotGraphs));
    } else {
        console.log(md);
    }
});
