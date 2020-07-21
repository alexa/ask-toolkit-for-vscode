export interface Resource {
    label?: string;
}

export class SmapiResource<T> {
    label?: string; 
    data: T;

    constructor(data: T, label?: string) {
        this.data = data;
        this.label = label;
    }
}
export interface CustomResource extends Resource {
    description: string;
    hasChildren?: boolean;
}