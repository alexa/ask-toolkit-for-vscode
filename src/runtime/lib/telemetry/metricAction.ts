import uuid from "uuid";
import { ActionType, MetricActionResult } from "./constants";

export class MetricAction {
    private result?: MetricActionResult;

    private name: string;

    private startTime: Date;

    private type: ActionType;

    public id: string;

    private endTime?: Date;

    private failureMessage: string;

    private ended: boolean;
  
    /**
     * @constructor
     * @param {string} name - The action name.
     * @param {string} type - The action type.
     */
    constructor(name: string, type: ActionType) {
      this.failureMessage = "";
      this.name = name;
      this.startTime = new Date();
      this.type = type;
      this.id = uuid();
      this.ended = false;
    }
  
    /**
     * Closes action
     * @param {Error} [error] - Error object indicating an error.
     */
    public end(error?: Error) {
      if (this.ended) {
        return;
      }
  
      const hasError = error instanceof Error;
      this.result = hasError ? MetricActionResult.FAILURE : MetricActionResult.SUCCESS;
      this.failureMessage = hasError ? (error?.message as string) : "";
      this.endTime = new Date();
      this.ended = true;
    }
  
    /**
     * Implementation of custom toJSON method to modify serialization with JSON.stringify
     */
    protected toJSON() {
      return {
        end_time: this.endTime,
        failure_message: this.failureMessage,
        name: this.name,
        result: this.result,
        start_time: this.startTime,
        type: this.type,
        id: this.id,
      };
    }
  }