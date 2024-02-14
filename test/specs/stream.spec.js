import { promisify } from "node:util";
import endOfStreamCB from "end-of-stream";
import { expect } from "chai";
import { getMultiPartStream } from "../helpers.js";
import { parseMultiPartStream } from "../../dist/stream.js";

const endOfStream = promisify(endOfStreamCB);

describe.only("parseMultiPartStream", function() {
    beforeEach(async function() {
        this.stream = await getMultiPartStream();
        this.emitter = parseMultiPartStream(this.stream);
    });

    afterEach(async function() {
        await endOfStream(this.stream);
    });

    it("outputs an emitter", async function() {
        expect(this.emitter).to.have.property("on").that.is.a("function");
        await this.emitter.whenComplete();
    });
});
