'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */

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

module.exports = {
    tshirtSizes,
    scores
};