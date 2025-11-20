export interface Curse {
    name: string;
    description: string;
    canApply(): boolean;
    apply(): Promise<void>;
    getDuration?(): number;

}