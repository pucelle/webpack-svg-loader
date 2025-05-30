import * as path from 'path'
import type {LoaderContext} from 'webpack'


/** `className -> {propertyName: propertyValue}` */
type ClassDeclaration = Map<string, Record<string, string>>

interface LoaderOptions {

	/** 
	 * Whether compress svg codes.
	 * Default value is `true`.
	 */
	compress: boolean

	/** 
	 * If `true`, will remove `svg` tag from `code`, and add `viewBox` item.
	 * Default value is `false`.
	 */
	cut: boolean

	/** 
	 * Which color will be replaced as default color.
	 * Default value is `null`.
	 */
	mainColor: string | null
}

const DefaultLoaderOptions: Required<LoaderOptions> = {
	compress: true,
	cut: false,
	mainColor: null,
}


export default function(this: LoaderContext<LoaderOptions>, source: string) {
	this.cacheable()

	let callback = this.async()!
	let processor = new SVGProcessor(this, source)

	callback(null, `export default ${JSON.stringify(processor.output())}`)
}


class SVGProcessor {

	private readonly options: Required<LoaderOptions>
	private readonly filePath: string
	private readonly source: string
	private readonly viewBox: [number, number, number, number]

	constructor(
		context: LoaderContext<LoaderOptions>,
		source: string
	) {
		this.filePath = context.resourcePath
		this.options = Object.assign({}, DefaultLoaderOptions, context.getOptions())
		this.source = source

		this.viewBox = this.checkViewBox()
	}

	private checkViewBox() {
		let match = this.source.match(/viewBox="(.+?)"/)
		if (!match) {
			throw new Error(`No "viewBox" in "${this.filePath}"`)
		}

		return match[1].split(' ').map(v => Number(v)) as [number, number, number, number]
	}

	output(): {id: string, viewBox?: [number, number, number, number], code: string} {
		let id = this.getId()
		let code = this.getCode()
		let o: {id: string, viewBox?: [number, number, number, number], code: string} = {id, code}

		if (this.options.cut) {
			o.viewBox = this.viewBox
		}

		return o
	}

	private getId(): string {
		return path.basename(this.filePath, '.svg')
	}

	private getCode(): string {
		if (this.options.compress) {
			return this.compress()
		}

		return this.source
	}

	private compress(): string {
		if (/<symbol/.test(this.source)) {
			throw new Error(`Symbol in not allowed in "${this.filePath}"`)
		}

		let map: ClassDeclaration = new Map()

		if (/<style/.test(this.source)) {
			let style = this.source.match(/<style.*?>([\s\S]*?)<\/style>/)![1]
			this.parseClassesInStyleTag(style, map)
		}
	
		let svgInner = this.getSVGInner(map)
		svgInner = this.processFillStroke(svgInner)
		svgInner = this.removeEmptyGroups(svgInner)
		svgInner = this.removeWhiteSpaces(svgInner)
	
		if (this.options.cut) {
			return svgInner
		}
		else {
			return `<svg viewBox="${this.viewBox.join(' ')}">${svgInner}</svg>`
		}
	}

	private parseClassesInStyleTag(style: string, map: ClassDeclaration) {
		let re = /(.+?)\s*\{([\s\S]*?)\}/g
		let match: RegExpExecArray | null

		while (match = re.exec(style)) {
			let selector = match[1]
			let declarations = match[2]
			let classNames = (selector.match(/\.[\w-]+/g) || []).map(v => v.slice(1))

			if (classNames.length > 0) {
				let sharedObject = this.parseStyleDeclarations(declarations)
			
				for (let className of classNames) {
					let object = Object.assign({}, sharedObject)

					let oldObject = map.get(className)
					if (oldObject) {
						object = Object.assign(oldObject, object)
					}

					map.set(className, object)
				}
			}
		}
	}

	private parseStyleDeclarations(declarations: string) {
		let re = /([\w-]+)\s*:\s*(.+?)\s*(?:;|$)/g
		let o: {[property: string]: string} = {}
		let match: RegExpExecArray | null

		while (match = re.exec(declarations)) {
			let property = match[1]
			let value = match[2]
			o[property] = value
		}

		return o
	}

	private getSVGInner(map: ClassDeclaration) {
		let svgInner = this.source.match(/<svg[\s\S]+?>\s*([\s\S]+?)\s*<\/svg>/)![1]

		svgInner = this.cleanSVGInner(svgInner)

		// classes to styles
		svgInner = svgInner.replace(/ class="(.+?)"/gi, (_m0, classNames) => {
			return ` style="${this.getStyleFromClassNames(classNames, map)}"`
		})
	
		// Merge g opacity to its children
		svgInner = svgInner.replace(/<g style="(opacity:.+?;)">\s*([\s\S]+?)\s*<\/g>/g, (_m0, m1, m2) => {
			let tabCount = 0
			let style = m1
	
			return m2.replace(/(<[\s\S]+?>)/g, (m0: string) => {
				let currentTabCount = tabCount
	
				if (m0[1] === '/') {
					tabCount--
					currentTabCount--
				}
				else if (m0[m0.length - 2] !== '/') {
					tabCount++
				}
	
				if (currentTabCount === 0) {
					return m0.replace(/style="(.+?)"/, `style="${style}$1"`)
				}
				else {
					return m0
				}
			})
		})
		
		return svgInner
	}

	private getStyleFromClassNames(classNameText: string, map: ClassDeclaration) {
		let classNames = classNameText.split(/\s+/)
		let o: {[property: string]: string} = {}

		for (let className of classNames) {
			Object.assign(o, map.get(className))
		}

		return Object.entries(o).map(([key, value]) => `${key}:${value}`).join(';')
	}

	private cleanSVGInner(svgInner: string) {
		// Remove comments, title, defs, style, enable-background
		svgInner = svgInner.replace(/<!--[\s\S]*?-->|<title>[\s\S]*?<\/title>|<defs>[\s\S]*?<\/defs>|<desc>[\s\S]*?<\/desc>|<style.*?>[\s\S]*?<\/style>|enable-background:new\s*;/gi, '')

		// Remove useless id
		svgInner = svgInner.replace(/\s*id="(.+?)"/gi, (m0, m1) => {
			if (svgInner.includes('url(#' + m1 + ')')) {
				return m0
			}
			else {
				return ''
			}
		})

		// Remove \n in quotes
		svgInner = svgInner.replace(/"([\s\S]+?)"/g, (_m0, m1) => {
			return '"' + m1.replace(/\r?\n\s*/g, '').trim() + '"'
		})
	
		// <...\n/>, remove useless \n
		svgInner = svgInner.replace(/\s+\/>/g, '/>')

		svgInner = svgInner.replace(/\s*data-name="(.+?)"/g, '')
		
		return svgInner
	}

	private processFillStroke(text: string) {
		let mainColorSource = this.getMainColorRegExpSource()

		let currentColorRE = mainColorSource
			? new RegExp('\\s*(stroke|fill|stop-color)\\s*:\\s*' + mainColorSource + ';', 'gi')
			: null

		text = text.replace(/(<(?:path|circle|rect|ellipse|line|polyline|polygon))(.*?\/?>)/g, (tag, left, right) => {
			if (!/style="(.*?)"/.test(tag)) {
				tag = left + ' style=""' + right
			}

			return tag
		})

		return text.replace(/\s*style="(.*?)"/g, (m0: string, m1: string) => {
			if (!m1.endsWith(';') && m1.trim()) {
				m0 = m0.replace(/"$/, ';"')
			}

			// I found `stroke-miterlimit` is not useful in codes generated by Illustrator
			m0 = m0.replace(/\s*stroke-miterlimit:\s*\d+;/gi, '')

			// Illustrator will not render stroke by default, but browsers will.
			if (!/fill\s*:/.test(m0) && !/stroke\s*:/.test(m0) && this.options.mainColor) {
				m0 = m0.replace(/"(.*?)"/, `"$1fill:${this.options.mainColor}; stroke:none;"`)
			}

			if (/fill\s*:/.test(m0) && !/stroke\s*:/.test(m0)) {
				m0 = m0.replace(/fill\s*:\s*.+?;/, '$&stroke:none;')
			}

			if (currentColorRE) {
				m0 = m0.replace(currentColorRE, '$1:currentColor;')
			}

			m0 = m0.replace(/\s*style="\s*"/gi, '')

			return m0
		})
	}

	private getMainColorRegExpSource(): string | null {
		if (!this.options.mainColor) {
			return null
		}

		let mainColor = this.options.mainColor.replace('#', '')
		if (mainColor.length === 3) {
			mainColor = mainColor + mainColor
		}

		if (/^(\w)\1(\w)\2(\w)\3$/.test(mainColor)) {
			mainColor = '(?:' + mainColor + '|' + mainColor[0] + mainColor[2] + mainColor[4] + ')'
		}

		return '#' + mainColor
	}

	private removeEmptyGroups(text: string) {
		let removedGroups: boolean[] = []

		return text.replace(/\s*(<(\/)?(\w+)([\s\S]*?)>)/g, (m0, _m1, isCloseTag, tag, attr) => {
			if (tag === 'g') {
				if (isCloseTag) {
					if (removedGroups.pop()) {
						return ''
					}
				}
				else {
					if (!attr || /^\s*id=".+?"\s*/.test(attr)) {
						removedGroups.push(true)
						return ''
					}
					else {
						removedGroups.push(false)
					}
				}
			}
	
			return m0
		})
	}

	private removeWhiteSpaces(text: string) {
		return text.replace(/\s*(<[\s\S]+?>)/g, '$1')
	}
}