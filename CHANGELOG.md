# Change Log
All notable changes to "solidity-code-metrics" will be documented in this file.

## v0.0.22
- new: CLI glob resolve provided paths
- update: dependencies

## v0.0.21
- new: CLI option `--html` - generates a standalone html report (default markdown)

## v0.0.20
- new: added `solidity-code-metrics` command
- new: updated solidity-parser, solidity-doppelganger

## v0.0.19
- new: metrics for `tryCatch` and `unchecked` blocks

## v0.0.18
- update: updated solidity doppelganger/regenerate patterns
  
## v0.0.17
- update: solidity parser to 0.13.2

## v0.0.16
- update: doppelganger to 0.0.5 (updating parser)
- new: metric: external dependencies - lists all external imports. 
    - imports may be an indicator of the capabilities and code-patterns used in a contract system.

![image](https://user-images.githubusercontent.com/2865694/103999393-1e008d00-519d-11eb-9ccd-77e1387781b1.png)

## v0.0.15
- update: surya to 0.4.2

## v0.0.14
- fix: **IMPORTANT** nSLOC metric in the table displayed all normalized source lines (including comments, blank lines) instead of normalized source code lines only. This has been changed with this release. `nSLOC` now displays normalized source-code lines (no comments, blank lines). The new column `nLines`  now displays the value that was formerly displayed for `nSLOC`. - #3

## v0.0.13
- fix: add option to disable solidity doppelganger (e.g. for in-browser use of solidity-metrics) - #2

## v0.0.12
- new: support abstract contracts

## v0.0.11
- update: solidity-doppelganger to v0.0.4

## v0.0.8 - v0.0.10
- updated: surya, solidity parser
- new: solidity-doppelganger detection
  
## v0.0.7
- updated: surya to 0.4.1-dev.2

## v0.0.6
- new: support for solidity `0.6.x`
- updated: surya to 0.4.0 #49
- updated: `solidity-parser-diligence` to community maintained `@solidity-parser/parser` #53

## v0.0.1 - 0.0.4

- first alpha
