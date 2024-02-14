export enum BoundaryResult {
    Boundary = "boundary",
    Epilogue = "epilogue",
    None = "none"
}

export enum ParseEvent {
    Complete = "complete",
    SectionContent = "section-content",
    SectionHeaders = "section-headers",
    SectionContentStream = "section-content-stream"
}

export enum ParseStatus {
    Boundary = "boundary",
    Content = "content",
    Epilogue = "epilogue",
    Headers = "headers"
}

export type SectionHeaders = {
    [key: string]: string;
};
