export interface Curse {
    name: string;
    description: string;
    canApply(): boolean;
    apply(): Promise<void>;
    undo?(): Promise<void>;
    getDuration?(): number;
}