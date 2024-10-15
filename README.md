# Webpack SVG Loader

For loading svg files to your typescript codes.



## How to use?



#### Step 1: Reference svg file type

```ts
import "@pucelle/webpack-svg-loader"
```

or

```ts
///<reference types="@pucelle/webpack-svg-loader" />
```

or 

```ts
declare module '*.svg' {
    const value: {
        id: string
        viewBox: [number, number, number, number]
        code: string
    }
    
    export default value
}
```


#### Step2: Import svg file in you typescript codes

```ts
// `svg` is `{id: string, viewBox: [number, number, number, number], code: string}` format.
import svg from 'svgName.svg'
```



#### Step3: Add a loader rule to your webpack configuration

```javascript
{
	module: {
		rules: [
			{
				test: /\.svg$/,
				loader: '@pucelle/webpack-svg-loader',

				options: {

					// If `true`, will remove whitespace, and useless tags and attributes to compress.
					// Be `true` by default.
					compress: true,

					// If `true`, will wrap svg codes in a symbol tag.
					// Be `false` by default.
					toSymbol: false,

					// The stroke or fill color which match main color will be replaced to `currentColor`,
					// so that you can re-modify the color from css codes,
					// or inherit color from ancestral elements.
					// Be `null` by default.
					mainColor: null,
				},
			}
		]
	}
}
```
