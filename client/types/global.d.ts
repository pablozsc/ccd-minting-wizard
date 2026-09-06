/// <reference types='vitest' />
/// <reference types="vite-plugin-svgr/client" />
declare const __IS_DEV__: boolean;
declare const __BASE_PATH__: string;
declare const __API__: string;

declare module '*.rs' {
    export const plainText: string
}

declare module '*.txt' {
    export const plainText: string
}

