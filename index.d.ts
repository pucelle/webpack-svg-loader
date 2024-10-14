declare module '*.svg' {
    const value: {
        id: string
        viewBox: [number, number, number, number]
        code: string
    }
    
    export default value
}
