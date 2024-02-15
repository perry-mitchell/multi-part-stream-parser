# Multi-Part-Stream-Parser
> Parse multi-part form data streams

## About

**Multi-Part-Stream-Parser** provides a capture mechanism for parsing multi-part encoded streams, allowing consumers to listen for each section (split by boundary) of a multi-part document.

## Installation

Simply install by running `npm install multi-part-stream-parser --save`.

Compatible with NodeJS 18 and up.

## Usage

Pass a readable stream of multi-part data to `parseMultiPartStream`:

```typescript
import { ParseEvent, parseMultiPartStream } from "multi-part-stream-parser";

// ...

const stream = getMultiPartStream(); // get a stream somehow

const emitter = parseMultiPartStream(stream);
emitter.on(ParseEvent.SectionHeaders, (sectionName, headers) => {
    // sectionName is a string, or null of not specified
    // headers is an object containing lower-cased headers
});
emitter.on(ParseEvent.SectionContent, (sectionName, contentBuffer) => {
    // contentBuffer is a buffer that contains the full
    // contents of the section
});
emitter.on(ParseEvent.SectionContentStream, (sectionName, contentStream) => {
    // contentStream is a readable stream of the section
    // contents
});

// ...

// Cleanup
emitter.destroy();
await emitter.whenComplete();
```
