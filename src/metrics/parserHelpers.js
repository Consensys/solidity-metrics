'use strict';
/** 
 * @author github.com/tintinweb
 * @license MIT
 * 
 * 
 * */

//taken from https://github.com/ConsenSys/surya/blob/3147a190152caf8da5e3cfc79d4afcda54d3b0aa/src/utils/parserHelpers.js
//thx goncalo and surya!

const BUILTINS_ASM = ['add', 'addmod', 'address', 'and', 'balance', 'blockhash', 'byte', 'call', 'callcode', 'calldatacopy', 'calldataload', 'calldatasize', 'caller', 'callvalue', 'codecopy', 'codesize', 'coinbase', 'create', 'create2', 'delegatecall', 'difficulty', 'div', 'dup1', 'dup10', 'dup11', 'dup12', 'dup13', 'dup14', 'dup15', 'dup16', 'dup2', 'dup3', 'dup4', 'dup5', 'dup6', 'dup7', 'dup8', 'dup9', 'eq', 'exp', 'extcodecopy', 'extcodehash', 'extcodesize', 'gas', 'gaslimit', 'gasprice', 'gt', 'iszero', 'jump', 'jumpdest', 'jumpi', 'log0', 'log1', 'log2', 'log3', 'log4', 'lt', 'mload', 'mod', 'msize', 'mstore', 'mstore8', 'mul', 'mulmod', 'not', 'number', 'or', 'origin', 'pc', 'pop', 'push1', 'push10', 'push11', 'push12', 'push13', 'push14', 'push15', 'push16', 'push17', 'push18', 'push19', 'push2', 'push20', 'push21', 'push22', 'push23', 'push24', 'push25', 'push26', 'push27', 'push28', 'push29', 'push3', 'push30', 'push31', 'push32', 'push4', 'push5', 'push6', 'push7', 'push8', 'push9', 'return', 'returndatacopy', 'returndatasize', 'revert', 'sar', 'sdiv', 'selfdestruct', 'sgt', 'sha3', 'shl', 'shr', 'signextend', 'sload', 'slt', 'smod', 'sstore', 'staticcall', 'stop', 'sub', 'swap1', 'swap10', 'swap11', 'swap12', 'swap13', 'swap14', 'swap15', 'swap16', 'swap2', 'swap3', 'swap4', 'swap5', 'swap6', 'swap7', 'swap8', 'swap9', 'timestamp', 'xor'];

const BUILTINS = [
  'gasleft', 'require', 'assert', 'revert', 'addmod', 'mulmod', 'keccak256',
  'sha256', 'sha3', 'ripemd160', 'ecrecover',
];

function isLowerCase(str) {
  return str === str.toLowerCase();
}

const parserHelpers = {
  BUILTINS,
  BUILTINS_ASM,
  isRegularFunctionCall: node => {
    const expr = node.expression;
    // @TODO: replace lowercase for better filtering
    return expr.type === 'Identifier' && isLowerCase(expr.name[0]) && !BUILTINS.includes(expr.name);
  },

  isMemberAccess: node => {
    const expr = node.expression;
    return expr.type === 'MemberAccess' && !['push', 'pop'].includes(expr.memberName);
  },

  isMemberAccessOfAddress: node => {
    const expr = node.expression.expression;
    return expr.type === 'FunctionCall' && 
      expr.expression.hasOwnProperty('typeName') && 
      expr.expression.typeName.name === 'address';
  },

  isAContractTypecast: node => {
    const expr = node.expression.expression;
    // @TODO: replace lowercase for better filtering
    return expr.type === 'FunctionCall' && 
      expr.expression.hasOwnProperty('name') && 
      !isLowerCase(expr.expression.name[0]);
  },

  isUserDefinedDeclaration: node => {
    return node.hasOwnProperty('typeName') && node.typeName.hasOwnProperty('type') && node.typeName.type === 'UserDefinedTypeName';
  },

  isAddressDeclaration: node => {
    return node.hasOwnProperty('typeName') && 
      node.typeName.hasOwnProperty('type') && 
      node.typeName.type === 'ElementaryTypeName' &&
      node.typeName.name === 'address';
  },
};

module.exports = parserHelpers;