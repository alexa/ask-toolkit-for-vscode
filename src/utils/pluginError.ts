'use strict';

export const processAbortedError = (reason: string) => {
    return new Error(`Process abort. ${reason}.`);
};