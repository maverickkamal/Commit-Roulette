import * as vscode from 'vscode';
import { Curse } from '../curse.interface';

export class PlaceboCurse implements Curse {
    name = "Placebo Curse";
    description = "Does absolutely nothing lol but makes you paranoid at least";

    canApply(): boolean {
        return true;
    }

    async apply(): Promise<void> {

        console.log('CommitRoulette: Placebo curse applied. Doing nothing.');
    }
}