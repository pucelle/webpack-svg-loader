declare module '*.svg' {
    const value: {

        /** File name base part. */
        id: string

        /** 
         * Codes like `<svg viewBox="...">...</svg>`.
         * If `cut` option is `true`, svg tag get removed.
         */
        code: string

        /** If `cut` option is `true`, this item is provided */
        viewBox?: [number, number, number, number]
    }
    
    export default value
}
