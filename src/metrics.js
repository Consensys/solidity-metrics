'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */
const parser = require('solidity-parser-diligence');
const parserHelpers = require("./parserHelpers");

const fs = require('fs');
const crypto = require('crypto');
const sloc = require('sloc');

const surya = require('surya');

const TSHIRT_HR = Object.freeze({"SMALL":"Small", "MEDIUM":"Medium", "LARGE":"Large", "X_LARGE":"X-Large", "XX_LARGE":"XX-Large", "XXXXXX_LARGE":"XXX-Huge!"});
const TSHIRT = Object.freeze({"SMALL":1, "MEDIUM":2, "LARGE":3, "X_LARGE":4, "XX_LARGE":5, "XXXXXX_LARGE":6});

const tshirtSizes = {
    nsloc: function(val) {
        if(val <= 200) return TSHIRT.SMALL;
        else if(val <= 1000) return TSHIRT.MEDIUM;
        else if(val <= 2000) return TSHIRT.LARGE;
        else if(val <= 4500) return TSHIRT.X_LARGE;
        else if(val <= 10000) return TSHIRT.XX_LARGE;
        else return TSHIRT.XXXXXX_LARGE;
    },
    files: function(val){
        if(val <= 4) return TSHIRT.SMALL;
        else if(val <= 20) return TSHIRT.MEDIUM;
        else if(val <= 30) return TSHIRT.LARGE;
        else if(val <= 60) return TSHIRT.X_LARGE;
        else if(val <= 150) return TSHIRT.XX_LARGE;
        else return TSHIRT.XXXXXX_LARGE;
    },
    perceivedComplexity: function(val) {
        if(val <= 50) return TSHIRT.SMALL;
        else if(val <= 100) return TSHIRT.MEDIUM;
        else if(val <= 200) return TSHIRT.LARGE;
        else if(val <= 400) return TSHIRT.X_LARGE;
        else if(val <= 600) return TSHIRT.XX_LARGE;
        else return TSHIRT.XXXXXX_LARGE;
    },
    commentRatio: function(val) {
        if(val <= 0.2) return TSHIRT.XXXXXX_LARGE;  // lessEq than 20% of source is comments
        else if(val <= 0.3) return TSHIRT.XX_LARGE;
        else if(val <= 0.4) return TSHIRT.X_LARGE;
        else if(val <= 0.5) return TSHIRT.LARGE;
        else if(val <= 0.6) return TSHIRT.MEDIUM;  // lessEq than 60% of source is comments
        else return TSHIRT.SMALL;  // > 60% of source is comments; good 
    },
    experimentalFeatures: function(arr){
        if(!arr) return TSHIRT.SMALL;
        else if(arr.length<=1) return TSHIRT.MEDIUM;
        else if(arr.length<=2) return TSHIRT.LARGE;
        return TSHIRT.SMALL;
    },
    compilerVersion: function(arr){
        if(!arr) return TSHIRT.SMALL;

        if(arr.some(x=>x.startsWith("0.4.") || x.startsWith("^0.4."))) return TSHIRT.MEDIUM;  //todo: rely on semver? we dont detect <0.4 atm
        return TSHIRT.SMALL;
    }
};

const scores = {
    IfStatement:1,
    ModifierInvocation:1,
    FunctionCall:1,
    "FunctionDefinition:Public":2,
    "FunctionDefinition:External":2,
    "FunctionDefinition:Payable":3,
    NewExpression:10,
    ForStatement:5,
    WhileStatement:1,
    DoWhileStatement:1,
    InlineAssemblyStatement:2,
    AssemblyIf:2,
    AssemblyFor:2,
    AssemblyCase:2,
    AssemblyCall:2,
    Conditional:1,
    SubAssembly:2,
    StateVariableDeclaration:1,
    "ContractDefinition:BaseContracts":2,
    ContractDefinition:1,
};

function capitalFirst(string) 
{
    if(!string.length) {
        return "";
    } else if(string.length==1){
        return string.toUpperCase();
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
}

class SolidityMetricsContainer {
    
    constructor(name, args){
        this.name = name;

        this.basePath = args.basePath || "";
        this.basePathRegex = new RegExp(this.basePath, "g");
        this.inputFileGlobExclusions = args.inputFileGlobExclusions || "";
        this.inputFileGlob = args.inputFileGlob || "";
        this.inputFileGlobLimit = args.inputFileGlobLimit;
        this.excludeFileGlobLimit = args.inputFileGlobLimit;
        this.debug = args.debug;
        this.repoInfo = args.repoInfo;

        this.seenFiles = [];
        this.seenDuplicates = [];
        this.seenHashes = [];
        this.metrics = [];
        this.errors = [];

        this.truffleProjectLocations = [];
        this.excludedFiles = [];
        
    }

    addTruffleProjectLocation(truffleJsPath){
        this.truffleProjectLocations = Array.from(new Set([truffleJsPath, ...this.truffleProjectLocations]));
    }

    addExcludedFile(exfile){
        this.excludedFiles = Array.from(new Set([exfile, ...this.excludedFiles]));
    }

    analyze(inputFileGlobs){

        return this.analyzeFile(inputFileGlobs);
    }

    analyzeFile(filepath){
        let content = fs.readFileSync(filepath).toString('utf-8');
        let hash = crypto.createHash('sha1').update(content).digest('base64');
        
        try {
            var metrics = new SolidityFileMetrics(filepath, content);

            this.seenFiles.push(filepath);
            if (this.seenHashes.indexOf(hash)>=0){
                //DUP
                this.seenDuplicates.push(filepath);
            } else {
                //NEW
                this.seenHashes.push(hash);
            }
            this.metrics.push(metrics);
        } catch (e) {
            console.error(e);
            this.errors.push(filepath);
            if (e instanceof parser.ParserError) {
                console.log(e.errors);
            }
            return;
        }
    }

    getDotGraphs(){
        return {
            '#surya-inheritance':surya.inheritance(this.seenFiles,{draggable:false}),  //key must match the div-id in the markdown template!
            '#surya-callgraph':surya.graph(this.seenFiles)
        };
    }

    totals(){
        let total = {
            totals : new Metric(),
            avg: new Metric(),
            num: {
                sourceUnits: this.seenFiles.length,
                metrics: this.metrics.length,
                duplicates: this.seenDuplicates.length,
                errors: this.errors.length,
            } 
        };

        total.totals = total.totals.sumCreateNewMetric(...this.metrics);
        total.totals.sloc.commentToSourceRatio = total.totals.sloc.comment/total.totals.sloc.source;
        total.avg = total.avg.sumAvgCreateNewMetric(...this.metrics);
        total.totals.nsloc.commentToSourceRatio = total.totals.nsloc.comment/total.totals.nsloc.source;

        return total;
    }

    /**
     * @note: div id must match the SolidityMetricsContainer.getDotGraphs() object key which is also the div-id!
     */
    generateReportMarkdown(){

        let totals = this.totals();
        let mdreport_head = `
[<img width="200" alt="get in touch with Consensys Diligence" src="https://user-images.githubusercontent.com/2865694/56826101-91dcf380-685b-11e9-937c-af49c2510aa0.png">](https://diligence.consensys.net)<br/>
<sup>
[[  🌐  ](https://diligence.consensys.net)  [  📩  ](mailto:diligence@consensys.net)  [  🔥  ](https://consensys.github.io/diligence/)]
</sup><br/><br/>



# Solidity Metrics for ${this.name}

## Table of contents

- [Scope](#t-scope)
    - [Source Units in Scope](#t-source-Units-in-Scope)
    - [Out of Scope](#t-out-of-scope)
        - [Excluded Source Units](#t-out-of-scope-excluded-source-units)
        - [Duplicate Source Units](#t-out-of-scope-duplicate-source-units)
- [Report Overview](#t-report)
    - [Risk Summary](#t-risk)
    - [Source Lines](#t-source-lines)
    - [Inline Documentation](#t-inline-documentation)
    - [Components](#t-components)
    - [Exposed Functions](#t-exposed-functions)
    - [StateVariables](#t-statevariables)
    - [Capabilities](#t-capabilities)
    - [Totals](#t-totals)

## <span id=t-scope>Scope</span>

This section lists files that are in scope for the metrics report. 

- **Project:** \`${this.name}\`
- **Included Files:** ${`\n` + this.inputFileGlob.replace("{","").replace("}","").split(",").map(g => `    - \`${g}\``).join("\n")}
- **Excluded Paths:** ${`\n` + this.inputFileGlobExclusions.replace("{","").replace("}","").split(",").map(g => `    - \`${g}\``).join("\n")}
- **File Limit:** \`${this.inputFileGlobLimit}\`
    - **Exclude File list Limit:** \`${this.excludeFileGlobLimit}\`

- **Workspace Repository:** \`${this.repoInfo.remote|| "unknown"}\` (\`${this.repoInfo.branch}\`@\`${this.repoInfo.commit}\`)

### <span id=t-source-Units-in-Scope>Source Units in Scope</span>

Source Units Analyzed: **\`${this.seenFiles.length}\`**<br>
Source Units in Scope: **\`${this.metrics.length}\`** (**${Math.round(this.metrics.length/this.seenFiles.length * 100)}%**)

| Type | File   | Logic Contracts | Interfaces | Lines | nSLOC | Comment Lines | Complex. Score | Capabilities |
|========|=================|============|=======|=======|===============|==============|
${this.metrics.map(m => `| ${m.metrics.num.contracts ? "📝" : ""}${m.metrics.num.libraries ? "📚" : ""}${m.metrics.num.interfaces ? "🔍" : ""} | ${m.filename.replace(this.basePath, "")} | ${(m.metrics.num.contracts + m.metrics.num.libraries) || "****"} | ${m.metrics.num.interfaces || "****"} | ${m.metrics.sloc.total || "****"} | ${m.metrics.nsloc.total || "****"} | ${m.metrics.sloc.comment || "****"} | ${m.metrics.complexity.perceivedNaiveScore || "****"} | **${m.metrics.capabilities.assembly ? "<abbr title='Uses Assembly'>🖥</abbr>":""}${m.metrics.capabilities.experimental.length ? "<abbr title='Experimental Features'>🧪</abbr>":""}${m.metrics.capabilities.canReceiveFunds ? "<abbr title='Payable Functions'>💰</abbr>":""}${m.metrics.capabilities.destroyable ? "<abbr title='Destroyable Contract'>💣</abbr>":""}${m.metrics.capabilities.explicitValueTransfer ? "<abbr title='Initiates ETH Value Transfer'>📤</abbr>":""}${m.metrics.capabilities.lowLevelCall ? "<abbr title='Performs Low-Level Calls'>⚡</abbr>":""}${m.metrics.capabilities.delegateCall ? "<abbr title='DelegateCall'>👥</abbr>":""}${m.metrics.capabilities.hashFuncs ? "<abbr title='Uses Hash-Functions'>🧮</abbr>":""}${m.metrics.capabilities.ecrecover ? "<abbr title='Handles Signatures: ecrecover'>🔖</abbr>":""}${m.metrics.capabilities.deploysContract ? "<abbr title='create/create2'>🌀</abbr>":""}** |`).join("\n")}
| ${totals.totals.num.contracts ? "📝" : ""}${totals.totals.num.libraries ? "📚" : ""}${totals.totals.num.interfaces ? "🔍" : ""} | **Totals** | **${(totals.totals.num.contracts + totals.totals.num.libraries) || ""}** | **${totals.totals.num.interfaces || ""}** | **${totals.totals.sloc.total}** | **${totals.totals.nsloc.total}** | **${totals.totals.sloc.comment}** | **${totals.totals.complexity.perceivedNaiveScore}** | **${totals.totals.capabilities.assembly ? "<abbr title='Uses Assembly'>🖥</abbr>":""}${totals.totals.capabilities.experimental.length ? "<abbr title='Experimental Features'>🧪</abbr>":""}${totals.totals.capabilities.canReceiveFunds ? "<abbr title='Payable Functions'>💰</abbr>":""}${totals.totals.capabilities.destroyable ? "<abbr title='Destroyable Contract'>💣</abbr>":""}${totals.totals.capabilities.explicitValueTransfer ? "<abbr title='Initiates ETH Value Transfer'>📤</abbr>":""}${totals.totals.capabilities.lowLevelCall ? "<abbr title='Performs Low-Level Calls'>⚡</abbr>":""}${totals.totals.capabilities.delegateCall ? "<abbr title='DelegateCall'>👥</abbr>":""}${totals.totals.capabilities.hashFuncs ? "<abbr title='Uses Hash-Functions'>🧮</abbr>":""}${totals.totals.capabilities.ecrecover ? "<abbr title='Handles Signatures: ecrecover'>🔖</abbr>":""}${totals.totals.capabilities.deploysContract ? "<abbr title='create/create2'>🌀</abbr>":""}** |

#### <span id=t-out-of-scope>Out of Scope</span>

##### <span id=t-out-of-scope-excluded-source-units>Excluded Source Units</span>

Source Units Excluded: **\`${this.excludedFiles.length}\`**

<a onclick="toggleVisibility('excluded-files', this)">[➕]</a>
<div id="excluded-files" style="display:none">
| File   |
|========|
${this.excludedFiles.length ? this.excludedFiles.map(f => `|${f.replace(this.basePath, "")}|`).join("\n") : "| None |"}

</div>


##### <span id=t-out-of-scope-duplicate-source-units>Duplicate Source Units</span>

Duplicate Source Units Excluded: **\`${this.seenDuplicates.length}\`** 

<a onclick="toggleVisibility('duplicate-files', this)">[➕]</a>
<div id="duplicate-files" style="display:none">
| File   |
|========|
${this.seenDuplicates.length ? this.seenDuplicates.map(f => `|${f.replace(this.basePath, "")}|`).join("\n") : "| None |"}

</div>


## <span id=t-report>Report</span>

### Overview

The analysis finished with **\`${this.errors.length}\`** errors and **\`${this.seenDuplicates.length}\`** duplicate files.

${this.errors.length ? "**Errors:**\n\n" + this.errors.join("\n* ") : ""}

${this.truffleProjectLocations.length ? "**Truffle Project Locations Observed:**\n* " + this.truffleProjectLocations.map(f => "./"+f.replace(this.basePath, "")).join("\n* ") : ""}

#### <span id=t-risk>Risk</span>

<div class="wrapper" style="max-width: 512px; margin: auto">
			<canvas id="chart-risk-summary"></canvas>
</div>

#### <span id=t-source-lines>Source Lines (sloc vs. nsloc)</span>

<div class="wrapper" style="max-width: 512px; margin: auto">
    <canvas id="chart-nsloc-total"></canvas>
</div>

#### <span id=t-inline-documentation>Inline Documentation</span>

- **Comment-to-Source Ratio:** On average there are\`${Math.round(totals.totals.sloc.source/totals.totals.sloc.comment *100)/100}\` code lines per comment (lower=better).
- **ToDo's:** \`${totals.totals.sloc.todo}\` 

#### <span id=t-components>Components</span>

| 📝Contracts   | 📚Libraries | 🔍Interfaces |
|=============|===========|============|
| ${totals.totals.num.contracts} | ${totals.totals.num.libraries}  | ${totals.totals.num.interfaces}   |

#### <span id=t-exposed-functions>Exposed Functions</span>

This section lists functions that are explicitly declared public or payable. Please note that getter methods for public stateVars are not included.  

| 🌐Public   | 💰Payable |
|============|===========|
| ${totals.totals.num.functionsPublic} | ${totals.totals.num.functionsPayable}  | 

| External   | Internal | Private | Pure | View |
|============|==========|=========|======|======|
| ${totals.totals.ast["FunctionDefinition:External"] || 0} | ${totals.totals.ast["FunctionDefinition:Internal"] || 0}  | ${totals.totals.ast["FunctionDefinition:Private"] || 0} | ${totals.totals.ast["FunctionDefinition:Pure"] || 0} | ${totals.totals.ast["FunctionDefinition:View"] || 0} |

#### <span id=t-statevariables>StateVariables</span>

| Total      | 🌐Public  |
|============|===========|
| ${totals.totals.num.stateVars}  | ${totals.totals.num.stateVarsPublic} |

#### <span id=t-capabilities>Capabilities</span>

| Solidity Versions observed | 🧪 Experimental Features | 💰 Can Receive Funds | 🖥 Uses Assembly | 💣 Has Destroyable Contracts | 
|============|===========|===========|===========|
| ${totals.totals.capabilities.solidityVersions.map( v => `\`${v}\``).join("<br/>")} | ${totals.totals.capabilities.experimental.map( v => `\`${v}\``).join("<br/>")} | \`${totals.totals.capabilities.canReceiveFunds ? "yes" : "no"}\` | \`${totals.totals.capabilities.assembly ? "yes" : "no"}\`<br/>(${totals.totals.num.assemblyBlocks} asm blocks) | \`${totals.totals.capabilities.destroyable ? "yes" : "no"}\` | 

| 📤 Transfers ETH | ⚡ Low-Level Calls | 👥 DelegateCall | 🧮 Uses Hash Functions | 🔖 ECRecover | 🌀 New/Create/Create2 |
|============|===========|===========|===========|===========|
| \`${totals.totals.capabilities.explicitValueTransfer ? "yes" : "no"}\` | \`${totals.totals.capabilities.lowLevelCall ? "yes" : "no"}\` | \`${totals.totals.capabilities.delegateCall ? "yes" : "no"}\` | \`${totals.totals.capabilities.hashFuncs ? "yes" : "no"}\` | \`${totals.totals.capabilities.ecrecover ? "yes" : "no"}\` | \`${totals.totals.capabilities.deploysContract ? "yes" : "no"}\`<br>${Object.keys(totals.totals.ast).filter(k => k.match(/(NewContract:|AssemblyCall:Name:create|AssemblyCall:Name:create2)/g)).map( k => `→ \`${k}\``).join("<br/>")} | 


#### <span id=t-totals>Totals</span>

##### Summary

<div class="wrapper" style="max-width: 90%; margin: auto">
    <canvas id="chart-num-bar"></canvas>
</div>

##### AST Node Statistics

###### Function Calls

<div class="wrapper" style="max-width: 90%; margin: auto">
    <canvas id="chart-num-bar-ast-funccalls"></canvas>
</div>

###### Assembly Calls

<div class="wrapper" style="max-width: 90%; margin: auto">
    <canvas id="chart-num-bar-ast-asmcalls"></canvas>
</div>

###### AST Total

<div class="wrapper" style="max-width: 90%; margin: auto">
    <canvas id="chart-num-bar-ast"></canvas>
</div>

##### Inheritance Graph

<a onclick="toggleVisibility('surya-inherit', this)">[➕]</a>
<div id="surya-inherit" style="display:none">
<div class="wrapper" style="max-width: 512px; margin: auto">
    <div id="surya-inheritance" style="text-align: center;"></div> 
</div>
</div>

##### CallGraph

<a onclick="toggleVisibility('surya-call', this)">[➕]</a>
<div id="surya-call" style="display:none">
<div class="wrapper" style="max-width: 512px; margin: auto">
    <div id="surya-callgraph" style="text-align: center;"></div>
</div>
</div>

###### Contract Summary

<a onclick="toggleVisibility('surya-mdreport', this)">[➕]</a>
<div id="surya-mdreport" style="display:none">
${surya.mdreport(this.seenFiles).replace("### ","#####").replace("## Sūrya's Description Report","").replace(this.basePathRegex, "") /* remove surya title, fix layout */} 

</div>
____
<sub>
Thinking about smart contract security? We can provide training, ongoing advice, and smart contract auditing. [Contact us](https://diligence.consensys.net/contact/).
</sub>

`; 

        let debug_dump_totals = `
\`\`\`json
    ${JSON.stringify(totals,null,2)}
\`\`\`
`;

        let debug_dump_units = `
#### Source Units

\`\`\`json
    ${JSON.stringify(this.metrics,null,2)}
\`\`\`
        `;

        if(this.debug){
            return mdreport_head + debug_dump_totals + debug_dump_units; 
        }
        return mdreport_head;
        
    }
}

class Metric {
    
    constructor() {
        this.ast = {};
        this.sloc = {};
        this.nsloc = {};
        this.complexity = {
            cyclomatic:undefined,
            perceivedNaiveScore:0
        };
        this.summary = {
            perceivedComplexity: undefined,
            size: undefined,
            numLogicContracts: undefined,
            numFiles: undefined,
            inheritance: undefined,
            callgraph: undefined,
            cyclomatic: undefined,
            interfaceRisk: undefined,
            inlineDocumentation: undefined,
            compilerFeatures: undefined,
            compilerVersion: undefined
        };
        this.num = {
            astStatements:0,
            contractDefinitions:0,
            contracts:0,
            libraries:0,
            interfaces:0,
            imports:0,
            functionsPublic:0,
            functionsPayable:0,
            assemblyBlocks:0,
            stateVars:0,
            stateVarsPublic:0,
        };
        this.capabilities = {
            solidityVersions: [],
            assembly: false,
            experimental: [],
            canReceiveFunds: false,
            destroyable: false,
            explicitValueTransfer: false,
            lowLevelCall: false,
            hashFuncs: false,
            ecrecover: false,
            deploysContract: false
        };

        this.xx = 0;
    }
    
    
    update(){
        // calculate naiveScore (perceived complexity)
        this.complexity.perceivedNaiveScore = 0;
        Object.keys(this.ast).map(function(value, index){
            this.complexity.perceivedNaiveScore += this.ast[value] * (scores[value] || 0);
        }, this);

        this.num.contractDefinitions = this.ast["ContractDefinition"] || 0;
        this.num.contracts = this.ast["ContractDefinition:Contract"] || 0;
        this.num.libraries = this.ast["ContractDefinition:Library"] || 0;
        this.num.interfaces = this.ast["ContractDefinition:Interface"] || 0;
        this.num.imports = this.ast["ImportDirective"] || 0;
        this.num.functionsPublic = (this.ast["FunctionDefinition:Public"] || 0) + (this.ast["FunctionDefinition:External"] || 0);
        this.num.functionsPayable = this.ast["FunctionDefinition:Payable"] || 0;
        this.num.assemblyBlocks = this.ast["InlineAssemblyStatement"] || 0;
        this.num.stateVars = this.ast["StateVariableDeclaration"] || 0;
        this.num.stateVarsPublic = this.ast["StateVariableDeclaration:Public"] || 0;


        // generate human readable ratings
        this.summary.size = tshirtSizes.nsloc(this.nsloc.source);
        this.summary.perceivedComplexity = tshirtSizes.perceivedComplexity(this.complexity.perceivedNaiveScore);
        this.summary.numLogicContracts = tshirtSizes.files(this.num.contracts+this.num.libraries);
        this.summary.interfaceRisk = tshirtSizes.files(this.num.functionsPublic+this.num.functionsPayable);
        this.summary.inlineDocumentation = tshirtSizes.commentRatio(this.nsloc.commentToSourceRatio);
        this.summary.compilerFeatures = tshirtSizes.experimentalFeatures(this.capabilities.experimental);
        this.summary.compilerVersion = tshirtSizes.compilerVersion(this.capabilities.solidityVersions);
        if(this.ast["SourceUnit"]>1) this.summary.numFiles = tshirtSizes.files(this.ast["SourceUnit"]);

        //postprocess the ast
        this.capabilities.assembly = Object.keys(this.ast).some(function(k){ return ~k.toLowerCase().indexOf("assembly"); });
        this.capabilities.canReceiveFunds = !!this.ast["FunctionDefinition:Payable"];

        this.capabilities.destroyable = !!(this.ast["FunctionCall:Name:selfdestruct"] || this.ast["FunctionCall:Name:suicide"] || this.ast["AssemblyCall:Name:selfdestruct"] || this.ast["AssemblyCall:Name:suicide"]);
        this.capabilities.explicitValueTransfer = this.ast["FunctionCall:Name:transfer"] || this.ast["FunctionCall:Name:send"] || Object.keys(this.ast).filter(k => k.startsWith("FunctionCall:Name:")).some(k => k.endsWith(".value"));  //any value call
        this.capabilities.lowLevelCall = Object.keys(this.ast).some(k => k.match(/(Function|Assembly)Call:Name:(delegatecall|callcode|staticcall|call)[\.$]/g));
        this.capabilities.delegateCall = Object.keys(this.ast).some(k => k.startsWith("FunctionCall:Name:delegatecall")) || !!this.ast["AssemblyCall:Name:delegatecall"];
        this.capabilities.hashFuncs =  Object.keys(this.ast).some(k => k.match(/(Function|Assembly)Call:Name:(keccak256|sha3|sha256|ripemed160)/g)); //ignore addmod|mulmod 
        this.capabilities.ecrecover = !!this.ast["FunctionCall:Name:ecrecover"];
        this.capabilities.deploysContract = Object.keys(this.ast).some(k => k.startsWith("NewContract:")) || !!(this.ast["AssemblyCall:Name:create"] || this.ast["AssemblyCall:Name:create2"]);
    }

    sumCreateNewMetric(...solidityFileMetrics){
        let result = new Metric();

        solidityFileMetrics.forEach(a => {  //arguments
            Object.keys(result).forEach(attrib => {  // metric attribs -> object
                Object.keys(a.metrics[attrib]).map(function(key, index) { // argument.keys		
                    if(typeof a.metrics[attrib][key]==="number")  // ADD
                        result[attrib][key] = (result[attrib][key] || 0) + a.metrics[attrib][key];
                    else if(typeof a.metrics[attrib][key]==="boolean")  // OR
                        result[attrib][key] = result[attrib][key] || a.metrics[attrib][key];
                    else if(Array.isArray(a.metrics[attrib][key]))  // concat arrays -> maybe switch to sets 
                        result[attrib][key] = Array.from(new Set([...result[attrib][key], ...a.metrics[attrib][key]]));
                });
            });
        });

        result.update();
        return result;
    }

    sumAvgCreateNewMetric(...solidityFileMetrics){
        let result = this.sumCreateNewMetric(...solidityFileMetrics);

        Object.keys(result).forEach(attrib => {  // metric attribs -> object
            Object.keys(result[attrib]).map(function(key, index) { // argument.keys		
                if(typeof result[attrib][key]==="number")  // ADD
                    result[attrib][key] /= solidityFileMetrics.length;
                else
                    delete result[attrib][key];  //not used
            });
        });

        result.update();
        return result;
    }

}

class SolidityFileMetrics {

    constructor(filepath, content){
        
        this.filename = filepath;
        this.metrics = new Metric();
        // analyze
        this.analyze(content);

        // get sloc
        this.metrics.sloc = sloc(content, "js");
        this.metrics.sloc.commentToSourceRatio = this.metrics.sloc.comment/this.metrics.sloc.source;

        // get normalized sloc (function heads normalized)
        const normalized = content.replace(/function\s*\S+\s*\([^{]*/g, 'function ', content);
        this.metrics.nsloc = sloc(normalized, "js");
        this.metrics.nsloc.commentToSourceRatio = this.metrics.nsloc.comment/this.metrics.nsloc.source;

        this.metrics.update();
    }

    analyze(content){
        let that = this;
        let ast = this.parse(content);

        let countAllHandler = {
            PragmaDirective(node){
                let pragmaString = node.name + ":" + node.value.replace(" ","_");
                that.metrics.ast["Pragma:"+pragmaString] = ++that.metrics.ast["Pragma:"+pragmaString] || 1;
                if(node.name.toLowerCase().indexOf("experimental")>=0){
                    that.metrics.capabilities.experimental.push(node.value);
                } else if(node.name.toLowerCase().indexOf("solidity")>=0){
                    that.metrics.capabilities.solidityVersions.push(node.value);
                }
            },
            ContractDefinition(node) {
                that.metrics.ast["ContractDefinition:"+capitalFirst(node.kind)] = ++that.metrics.ast["ContractDefinition:"+capitalFirst(node.kind)] || 1;
                that.metrics.ast["ContractDefinition:BaseContracts"] = that.metrics.ast["ContractDefinition:BaseContracts"] + node.baseContracts.length || node.baseContracts.length;
            },
            FunctionDefinition(node){
                let stateMutability = node.stateMutability || "internal"; //set default
                that.metrics.ast["FunctionDefinition:"+capitalFirst(stateMutability)] = ++that.metrics.ast["FunctionDefinition:"+capitalFirst(stateMutability)]|| 1;
                that.metrics.ast["FunctionDefinition:"+capitalFirst(node.visibility)] = ++that.metrics.ast["FunctionDefinition:"+capitalFirst(node.visibility)] || 1;
            },
            StateVariableDeclaration(node){
                //NOP - this already counts the VariableDeclaration subelements.

            },
            VariableDeclaration(node){
                let typeName = "VariableDeclaration";
                if(node.isStateVar){
                    typeName = "StateVariableDeclaration";
                    that.metrics.ast[typeName+":"+capitalFirst(node.visibility)] = ++that.metrics.ast[typeName+":"+capitalFirst(node.visibility)]|| 1;
                }

                if(node.storageLocation){
                    that.metrics.ast[typeName+":"+capitalFirst(node.storageLocation)] = ++that.metrics.ast[typeName+":"+capitalFirst(node.storageLocation)]|| 1;
                }
                
                if(node.isDeclaredConst)
                    that.metrics.ast[typeName+":Const"] = ++that.metrics.ast[typeName+":Const"]|| 1;
                if(node.isIndexed)
                    that.metrics.ast[typeName+":Indexed"] = ++that.metrics.ast[typeName+":Indexed"]|| 1;
            },
            UserDefinedTypeName(node){
                that.metrics.ast["UserDefinedTypeName:"+capitalFirst(node.namePath)] = ++that.metrics.ast["UserDefinedTypeName:"+capitalFirst(node.namePath)]|| 1;
            },
            FunctionCall(node){
                let callName;
                let funcCallType;

                if(parserHelpers.isRegularFunctionCall(node)){
                    funcCallType = "Regular";
                    callName = node.expression.name;
                } else if (parserHelpers.isMemberAccess(node)) {
                    funcCallType =  parserHelpers.isMemberAccessOfAddress(node) ? "Address" : parserHelpers.isAContractTypecast(node) ? "ContractTypecast" : "MemberAccess";
                    callName = node.expression.memberName;

                    if(callName=="value" && parserHelpers.isMemberAccess(node.expression)){
                        // address.call.value(val)(data)
                        callName = node.expression.expression.memberName + "." + callName;
                    }
                } else if (node.expression && node.expression.type=="Identifier" && parserHelpers.BUILTINS.includes(node.expression.name)){
                    funcCallType = "BuiltIn";
                    callName = node.expression.name;
                } else if (node.expression && node.expression.type == "NewExpression") {
                    if(node.expression.typeName.type == "UserDefinedTypeName"){
                        //count contract creation calls
                        that.metrics.ast["NewContract:"+node.expression.typeName.namePath] = ++that.metrics.ast["NewContract:"+node.expression.typeName.namePath] || 1;
                    }
                } else {
                    // else TypeNameConversion (e.g. casts.)
                }

                if(funcCallType){
                    that.metrics.ast["FunctionCall:Type:"+funcCallType] = ++that.metrics.ast["FunctionCall:Type:"+funcCallType] || 1;
                    that.metrics.ast["FunctionCall:Name:"+callName] = ++that.metrics.ast["FunctionCall:Name:"+callName] || 1;   
                }
            },
            AssemblyCall(node){
                if(node.functionName && parserHelpers.BUILTINS_ASM.includes(node.functionName)){
                    that.metrics.ast["AssemblyCall:Name:"+node.functionName] = ++that.metrics.ast["AssemblyCall:Name:"+node.functionName] || 1;    
                } 
            }
        };

        let countAll= new Proxy(
            countAllHandler,{
                get(target, name) {
                    //note: this is getting called twice , once for the vistor[node.name] check and then for visitor[node.name](node) call.
                    if(name.endsWith(":exit")) return;  //skip func-exits

                    //we have to fix all handler native values afterwards (/2) for the 2nd get call.
                    that.metrics.ast[name] = ++that.metrics.ast[name] || 1;
                    that.metrics.num.astStatements += 1;
        
                    return target[name];
                }       
        });
        parser.visit(ast, countAll);

        // IMPORTANT: fix values caused by the proxy being entered twice by diligence parser for defined handler functions (once to check if handler is available, and for handler call) 
        Object.keys(countAllHandler).forEach( k => this.metrics.ast[k] ? this.metrics.ast[k] /= 2 : undefined )

    }

    parse(content){
        var ast = parser.parse(content, {loc:false, tolerant:true});
        return ast;
    }
}

module.exports = {
    SolidityMetricsContainer:SolidityMetricsContainer
};

