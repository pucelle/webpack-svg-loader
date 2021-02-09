# Webpack loader for webgl shaders in typescript language


## How to use?

#### Import shader text in you typescript file:

```ts
import shaderText from 'shaderFilePath.glsl'
```

#### Add a loader module in configuration

```javascript
{
	module: {
		loaders: [
			{
				test: /\.(glsl|vert|frag|vs|fs)$/,
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