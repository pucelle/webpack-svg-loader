# Webpack loader for loading svg files in typescript language



## How to use?



#### Reference svg file type

```ts
///<reference types="@pucelle/webpack-svg-loader" />
```



#### Import svg text in you typescript file

```ts
// `svgText` is `{id: string, code: string}` format.
import svgText from 'svgFilePath.svg'
```



#### Add a loader module in configuration

```javascript
{
	module: {
		loaders: [
			{
				test: /\.svg$/,
				loader: '@pucelle/webpack-svg-loader',

				options: {

					// If `true`, will remove whitespaces to compress, be `true` by default.
					compress: true,

					// If `true`, will wrap svg codes in a symbol tag, be `false` by default.
					inSymbolType: false,

					// The main color will be replaced as default color, such that you can re-modify from css codes,
					// or inherit color from parent elements.
					mainColor: '#000000',
				},
			}
		]
	}
}
```



## License

MIT