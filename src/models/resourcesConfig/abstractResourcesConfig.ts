import * as R from 'ramda';
import { write, read } from '../../runtime/lib/utils/jsonUtility';

/**
 * A utility class to define common methods for getting and setting data in a config JSON file
 */
export class AbstractResourcesConfig {
    protected filePath: string;
    content: any;

    /**
      * Constructor for an ask resources config class
      * @param filePath  The path of the config file
      * @param content  The JSON object of the config file, the given content will replace an existing one
      */
    constructor(filePath: string, content?: any) {
        this.filePath = filePath;
        if (content !== undefined) {
          write(filePath, content);
        }
        this.read();
    }

    /**
      * To get the value with the given lens path from the JSON object
      * @param pathArray 
      */
    getProperty(pathArray: string[]): string {
        return R.view(R.lensPath(pathArray), this.content);
    }

    /**
      * To assign a value to the given lens path in the JSON object 
      * @param pathArray 
      * @param value 
      */
    setProperty(pathArray: string[], value: string | undefined): void {
        this.content = R.set(R.lensPath(pathArray), value, this.content);
    }

    /**
      * To write a JSON file
      */
    write(): void {
        write(this.filePath, this.content);
    }

    /**
      * To read the JSON file
      */
    read(): any {
        this.content = read(this.filePath);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this.content;
    }
}
