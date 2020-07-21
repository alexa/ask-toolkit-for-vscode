export async function promiseRetry<T>(retries: number, fn: () => Promise<T>): Promise<T>  {
    return fn().catch((err: Error) => {
        if(retries > 1) {
            return promiseRetry(retries - 1, fn);
        } else {
            return Promise.reject(err);
        }
    });
}