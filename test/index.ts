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

import * as glob from "glob";
import * as paths from "path";
import * as Mocha from "mocha";

// The test coverage approach is inspired by https://github.com/microsoft/vscode-js-debug/blob/master/src/test/testRunner.ts
function setupCoverage() {
    const NYC = require("nyc");
    const nyc = new NYC({
        // set the project root
        cwd: paths.join(__dirname, "..", ".."),
        exclude: ["**/test/**", ".vscode-test/**"],
        reporter: ["html"],
        all: true,
        instrument: true,
        hookRequire: true,
        hookRunInContext: true,
        hookRunInThisContext: true,
    });

    nyc.reset();
    nyc.wrap();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return nyc;
}

const mocha = new Mocha({
    ui: "bdd",
    color: true,
    timeout: 10 * 1000,
});

export async function run(): Promise<any> {

    const nyc = setupCoverage();
    // only search test files under out/test
    const options = { cwd: __dirname };
    const files = glob.sync("**/**.test.js", options);
    for (const file of files) {
        mocha.addFile(`${__dirname}/${file}`);
    }
    try {
        await new Promise((resolve, reject) =>
            mocha.run(failures => (failures ? reject(new Error(`${failures} tests failed`)) : resolve()))
        );
    } finally {
        if (nyc !== undefined) {
            nyc.writeCoverageFile();
            nyc.report();
        }
    }
}
