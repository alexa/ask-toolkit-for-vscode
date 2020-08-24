// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// a function run(testRoot: string, clb: (error:Error) => void) that the extension
// host can call to run the tests. The test runner is expected to use console.log
// to report the results back to the caller. When the tests are finished, return
// a possible error to the callback or null if none.

/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */


"use strict";

import * as fs from "fs";
import * as glob from "glob";
import * as paths from "path";
import * as Mocha from 'mocha';

const istanbul = require("istanbul");
const remapIstanbul = require("remap-istanbul");

const mocha = new Mocha({
    ui: "bdd",
    useColors: true,
    timeout: 0
});


function _mkDirIfNotExists(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

function _readCoverOptions(testsRoot: string): ITestRunnerOptions | undefined {
    const coverConfigPath = paths.join(testsRoot, "..", "..", "coverConfig.json");
    // eslint-disable-next-line no-undef-init
    let coverConfig: ITestRunnerOptions | undefined = undefined;
    if (fs.existsSync(coverConfigPath)) {
        const configContent = fs.readFileSync(coverConfigPath, "utf-8");
        coverConfig = JSON.parse(configContent);
    }
    return coverConfig;
}

export function run(testsRoot: string, clb: (error: Error | undefined) => void): any {
    // Enable source map support for stack traces
    // ref: https://www.npmjs.com/package/source-map-support#typescript-demo
    require("source-map-support").install();

    // Read configuration for the coverage file
    const coverOptions: ITestRunnerOptions | undefined = _readCoverOptions(testsRoot);
    if (coverOptions === undefined) {
        return clb(new Error('coverageConfig.json is missing'));
    }
    
    if (coverOptions.enabled === true) {
        // Setup coverage pre-test, including post-test hook to report
        const coverageRunner = new CoverageRunner(coverOptions, testsRoot, clb);
        coverageRunner.setupCoverage();
    }

    // Glob test files
    glob("**/**.test.js", { cwd: testsRoot }, (error, files): any => {
        if (error) {
            return clb(error);
        }
        // Add files to the test suite
        files.forEach((f): Mocha => {
            return mocha.addFile(paths.join(testsRoot, f));
        });
        try {
            // Run the mocha test
            mocha.run(failures => {
                if (failures > 0) {
                    clb(new Error(`${failures} tests failed.`));
                } else {
                    clb(undefined);
                }
            });
        } catch (err) {
            clb(err);
        }
    });
}

interface ITestRunnerOptions {
    enabled?: boolean;
    relativeCoverageDir: string;
    relativeSourcePath: string;
    ignorePatterns: string[];
    includePid?: boolean;
    reports?: string[];
    verbose?: boolean;
}

// Adapted from https://github.com/codecov/example-typescript-vscode-extension
class CoverageRunner {

    private coverageVar: string = "$$cov_" + new Date().getTime().toString() + "$$";
    private transformer: any = undefined;
    private matchFn: any = undefined;
    private instrumenter: any = undefined;

    constructor(private options: ITestRunnerOptions, private testsRoot: string, private endRunCallback: any) {
        if (!options.relativeSourcePath) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return endRunCallback("Error - relativeSourcePath must be defined for code coverage to work");
        }

    }

    public setupCoverage(): void {
        // Set up Code Coverage, hooking require so that instrumented code is returned
        this.instrumenter = new istanbul.Instrumenter({ coverageVariable: this.coverageVar });
        const sourceRoot = paths.join(this.testsRoot, this.options.relativeSourcePath);

        // Glob source files
        const srcFiles = glob.sync("**/**.js", {
            cwd: sourceRoot,
            ignore: this.options.ignorePatterns,
        });

        // Create a match function - taken from the run-with-cover.js in istanbul.
        const decache = require("decache");
        const fileMap = {};
        srcFiles.forEach( (file) => {
            const fullPath = paths.join(sourceRoot, file);
            fileMap[fullPath] = true;

            // On Windows, extension is loaded pre-test hooks and this mean we lose
            // our chance to hook the Require call. In order to instrument the code
            // we have to decache the JS file so on next load it gets instrumented.
            // This doesn't impact tests, but is a concern if we had some integration
            // tests that relied on VSCode accessing our module since there could be
            // some shared global state that we lose.
            decache(fullPath);
        });

        this.matchFn = (file): boolean => { return fileMap[file] as boolean; };
        this.matchFn.files = Object.keys(fileMap);

        // Hook up to the Require function so that when this is called, if any of our source files
        // are required, the instrumented version is pulled in instead. These instrumented versions
        // write to a global coverage variable with hit counts whenever they are accessed
        this.transformer = this.instrumenter.instrumentSync.bind(this.instrumenter);
        const hookOpts = { verbose: false, extensions: [".js"]};
        istanbul.hook.hookRequire(this.matchFn, this.transformer, hookOpts);

        // initialize the global variable to stop mocha from complaining about leaks
        global[this.coverageVar] = {};

        // Hook the process exit event to handle reporting
        // Only report coverage if the process is exiting successfully
        process.on("exit", () => {
            this.reportCoverage();
        });
    }

    /**
     * Writes a coverage report. Note that as this is called in the process exit callback, all calls must be synchronous.
     *
     * @returns {void}
     *
     * @memberOf CoverageRunner
     */
    public reportCoverage(): void {
        istanbul.hook.unhookRequire();
        let cov: any;
        if (typeof global[this.coverageVar] === "undefined" || Object.keys(global[this.coverageVar]).length === 0) {
            console.error("No coverage information was collected, exit without writing coverage information");
            return;
        } else {
            cov = global[this.coverageVar];
        }

        // TODO consider putting this under a conditional flag
        // Files that are not touched by code ran by the test runner is manually instrumented, to
        // illustrate the missing coverage.
        this.matchFn.files.forEach( (file) => {
            try {
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                if (!cov[file]) {
                    this.transformer(fs.readFileSync(file, "utf-8"), file);

                    // When instrumenting the code, istanbul will give each FunctionDeclaration a value of 1 in coverState.s,
                    // presumably to compensate for function hoisting. We need to reset this, as the function was not hoisted,
                    // as it was never loaded.
                    Object.keys(this.instrumenter.coverState.s).forEach( (key) => {
                        this.instrumenter.coverState.s[key] = 0;
                    });

                    cov[file] = this.instrumenter.coverState;
                }
            } catch (e) {
                console.error(e);
            }

        });

        // TODO Allow config of reporting directory with
        let reportingDir = paths.join(this.testsRoot, this.options.relativeCoverageDir);
        let includePid = this.options.includePid;
        let pidExt = includePid === true ? `-${process.pid}` : "";
        let coverageFile = paths.resolve(reportingDir, "coverage" + pidExt + ".json");

        _mkDirIfNotExists(reportingDir); // yes, do this again since some test runners could clean the dir initially created

        fs.writeFileSync(coverageFile, JSON.stringify(cov), "utf8");

        let remappedCollector = remapIstanbul.remap(cov, {warn: warning => {
            // We expect some warnings as any JS file without a typescript mapping will cause this.
            // By default, we"ll skip printing these to the console as it clutters it up
            if (this.options.verbose === true) {
                console.warn(warning);
            }
        }});

        const reporter = new istanbul.Reporter(undefined, reportingDir);
        const reportTypes = (this.options.reports instanceof Array) ? this.options.reports : ["lcov"];
        reporter.addAll(reportTypes);
        reporter.write(remappedCollector, true, () => {
            console.log(`reports written to ${reportingDir}`);
        });
    }
}