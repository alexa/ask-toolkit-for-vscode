import { isNonBlankString } from './stringUtils';

//TODO: Extend support for Promises.
export function resolver(chain: (string | undefined)[]): string {
    for (const item of chain) {
        if (item !== undefined && isNonBlankString(item)) {
            return item;
        }
    }
    return '';
}