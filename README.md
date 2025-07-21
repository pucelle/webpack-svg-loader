# Webpack SVG Loader

For loading svg files to your typescript codes.



## How to use?



#### Step 1: Reference svg file type

```ts
///<reference types="@pucelle/webpack-svg-loader" />
```

or 

```ts
declare module '*.svg' {
    export default string
}
```


#### Step2: Import svg file in you typescript codes

```ts
// Variable `svg` is svg code string.
import svg from 'svg-file-name.svg'
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

					/** 
					 * Whether compress svg codes.
					 * Default value is `true`.
					 */
					compress: boolean

					// The stroke or fill color which match main color will be replaced to `currentColor`,
					// so that you can re-modify the color from css codes,
					// or inherit color from ancestral elements.
					// Be `null` by default.
					mainColor: '#000',
				},
			}
		]
	}
}
```
