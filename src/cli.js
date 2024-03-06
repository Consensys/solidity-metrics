#!/usr/bin/env node
'use strict';
/**
 * @author github.com/tintinweb
 * @license MIT
 *
 *
 * */

const glob = require('glob');
const { SolidityMetricsContainer } = require('./metrics/metrics');
const { exportAsHtml } = require('./metrics/helper');
const path = require('path');
const fs = require('fs');
const { setVerbose, verboseLog } = require('./logger');

const helpMessage = `
Usage: solidity-code-metrics [options] [<glob patterns>]

Options:
  --help           Display this help message and exit
  --verbose        Enable verbose output
  --html           Output results in HTML format
  --scope-file <path>  Read glob patterns from a file

Note: If a scope file is provided, glob patterns from command line will be ignored.
`;

let metrics = new SolidityMetricsContainer("'CLI'", {
  basePath: '',
  initDoppelGanger: undefined,
  inputFileGlobExclusions: undefined,
  inputFileGlob: undefined,
  inputFileGlobLimit: undefined,
  debug: false,
  repoInfo: {
    branch: undefined,
    commit: undefined,
    remote: undefined,
  },
});

let options = {
  verbose: false,
  html: false,
  scopeFile: null, // Path to the scope file
};
let fileGlobs = [];
let filesFound = false;

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg.startsWith('--')) {
    switch (arg) {
      case '--help':
        console.log(helpMessage);
        process.exit(0);
      case '--verbose':
        options.verbose = true;
        break;
      case '--html':
        options.html = true;
        break;
      case '--scope-file':
        i++; // Increment i to skip the next argument since it's the path to the scope file
        if (i < process.argv.length) {
          options.scopeFile = process.argv[i];
        } else {
          console.error('Error: --scope-file option requires a path argument.');
          process.exit(1);
        }
        break;
      default:
        console.warn(`Warning: Unknown option '${arg}'`);
    }
  } else {
    // Assume all non-option arguments are file globs
    fileGlobs.push(arg);
  }
}

if (options.scopeFile && fileGlobs.length > 0) {
  console.error(
    'Error: Cannot specify both a scope file and direct glob patterns.'
  );
  process.exit(1);
}

if (options.scopeFile) {
  const scopeFileDir = path.dirname(options.scopeFile);
  try {
    // Read glob patterns from the scope file
    const scopeFileContent = fs.readFileSync(options.scopeFile, 'utf8');
    const scopeGlobs = scopeFileContent.split(/\r?\n/).filter(line => line.trim() !== '');
    // Resolve each glob pattern relative to the scope file directory
    scopeGlobs.forEach((globPattern) => {
      const resolvedGlob = path.join(scopeFileDir, globPattern);
      fileGlobs.push(resolvedGlob);
    });
  } catch (err) {
    console.error(
      `Error reading scope file '${options.scopeFile}': ${err.message}`
    );
    process.exit(1);
  }
}

setVerbose(options.verbose);

// Analyze files matching the globs
fileGlobs.forEach((globPattern) => {
  verboseLog('glob: ' + globPattern);
  let matchedFiles = glob.sync(globPattern);
  matchedFiles.forEach((filePath) => {
    if (fs.lstatSync(filePath).isFile() && path.extname(filePath) === '.sol') {
      filesFound = true;
      metrics.analyzeFile(filePath);
    }
  });
});

// Check if no files were found for all glob patterns
if (!filesFound) {
  console.error('Error: No files found matching the provided glob patterns.');
  process.exit(1);
}

// Output
// console.log(metrics.totals());
try {
  let dotGraphs = metrics.getDotGraphs();
  metrics.generateReportMarkdown().then((md) => {
    if (options.html) {
      console.log(exportAsHtml(md, metrics.totals(), dotGraphs));
    } else {
      console.log(md);
    }
  });
} catch (error) {
  console.error(error);
}
