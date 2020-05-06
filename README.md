[<img width="200" alt="get in touch with Consensys Diligence" src="https://user-images.githubusercontent.com/2865694/56826101-91dcf380-685b-11e9-937c-af49c2510aa0.png">](https://diligence.consensys.net)<br/>
<sup>
[[  🌐  ](https://diligence.consensys.net)  [  📩  ](https://github.com/ConsenSys/vscode-solidity-metrics/blob/master/mailto:diligence@consensys.net)  [  🔥  ](https://consensys.github.io/diligence/)]
</sup><br/><br/>


# Solidity Code Metrics

[🌐](https://www.npmjs.com/package/solidity-code-metrics) `npm install solidity-code-metrics` 

The number-crunching enginge behind 📊[tintinweb.solidity-metrics](https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-metrics).

![vscode-solidity-metrics3](https://user-images.githubusercontent.com/2865694/78451004-0252de00-7683-11ea-93d7-4c5dc436a14b.gif)

## Example

```js

const {SolidityMetricsContainer} = require('solidity-metrics');

let options = {
    basePath:"",
    inputFileGlobExclusions:undefined,
    inputFileGlob: undefined,
    inputFileGlobLimit: undefined,
    debug:false,
    repoInfo: {
        branch: undefined,
        commit: undefined,
        remote: undefined
    }    
}

let metrics = new SolidityMetricsContainer("metricsContainerName", options);


// analyze files
metrics.analyze(path_to_solidity_file);
// ...
metrics.analyze(path_to_solidity_file_N);

// output
console.log(metrics.totals());
console.log(metrics.generateReportMarkdown());
```
