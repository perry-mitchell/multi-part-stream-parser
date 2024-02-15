import type { Readable } from "node:stream";
import EventEmitter from "eventemitter3";
import { ParseEvent, SectionHeaders } from "./types.js";
import { debugEmitter } from "./debug.js";

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
            debugEmitter("parse complete event received");
            this.__completed = true;
        });
    }

    get complete(): boolean {
        return this.__completed;
    }

    destroy(): void {
        if (this.__completed) return;
        debugEmitter("destroy");
        this.__completed = true;
        this.emit(ParseEvent.Complete);
    }

    async whenComplete(): Promise<void> {
        if (this.__completed) return;
        await new Promise<void>(resolve => {
            this.once(ParseEvent.Complete, resolve);
        });
    }
}
