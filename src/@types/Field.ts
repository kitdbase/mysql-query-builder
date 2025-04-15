export interface Field {
    name: string;
    type: string;
    defaultValue?: string | null | undefined | number | boolean;
    length?: number;
    options?: string[];
    foreign?: {
        table: string;
        column: string;
    };
}

export interface Condition {
    column?: string;
    operator?: string;
    value?: any;
    query?: any;
    type: string;
    isGroup: boolean;
}

export interface OrderBy {
    column: string;
    direction: string;
}