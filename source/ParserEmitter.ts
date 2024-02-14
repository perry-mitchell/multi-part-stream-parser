import type { Readable } from "node:stream";
import EventEmitter from "eventemitter3";
import { ParseEvent, SectionHeaders } from "./types.js";

export interface ParserEvents {
    [ParseEvent.Complete]: () => void;
    [ParseEvent.SectionContent]: (name: string | null, content: string | Buffer) => void;
    [ParseEvent.SectionContentStream]: (name: string | null, stream: Readable) => void;
    [ParseEvent.SectionHeaders]: (name: string | null, headers: SectionHeaders) => void;
}

export class ParserEmitter extends EventEmitter<ParserEvents> {
    private __completed: boolean = false;

    constructor() {
        super();
        this.once(ParseEvent.Complete, () => {
            this.__completed = true;
        });
    }

    get complete(): boolean {
        return this.__completed;
    }

    async whenComplete(): Promise<void> {
        if (this.__completed) return;
        await new Promise<void>(resolve => {
            this.once(ParseEvent.Complete, resolve);
        });
    }
}
