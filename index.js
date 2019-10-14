const {resolve} = require("path")
const {Plugin} = require("powercord/entities")
const {forceUpdateElement} = require("powercord/util")
const {inject, uninject} = require("powercord/injector")
const {React, getModule, getModuleByDisplayName} = require("powercord/webpack")

const Settings = require("./components/Settings")

class ModuleStore extends Map {
	constructor(items) {
		super()
		this.inprogress = []
		items.forEach(item => {
			this.fetch(item[0], item[1], item[2])
		})
	}

	fetch(property, modules, save) {
		if (!modules) modules = property
		if (!save) save = property
		if (typeof modules === "string") modules = [modules]
		const promise = getModule(modules)
		this.inprogress.push(promise)
		promise.then(result => {
			this.inprogress.splice(this.inprogress.indexOf(promise), 1)
			this.set(save, result[property])
		})
	}

	wait() {
		return Promise.all(this.inprogress)
	}
}

module.exports = class QuickReact extends Plugin {
	normaliseName(name) {
		return name.replace(/[ :]/g, "")
	}

	nameToUnicode(name) {
		name = this.normaliseName(name)
		let emoji = this.modules.get("getByName")(name)
		if (!emoji) return null
		else if (!emoji.surrogates) return null
		else return emoji.surrogates
	}

	nameToURL(name) {
		const unicode = this.nameToUnicode(name)
		return this.modules.get("getURL")(unicode)
	}

	loadSettings() {
		this.emojis = this.settings.get("emojis", [])
	}

	saveSettings() {
		this.settings.set("emojis", this.emojis)
	}

	forceUpdate() {
		forceUpdateElement("."+this.modules.get("content").split(" ")[0], true)
	}

	async startPlugin() {
		this.loadSettings()
		this.registerSettings("powercord-quick-react", "Quick React", props =>
		React.createElement(Settings, Object.assign(props, {plugin: this}))
		)
		this.loadCSS(resolve(__dirname, "style.scss"))

		this.modules = new ModuleStore([
			["convert"],
			["addReaction"],
			["getURL"],
			["getByName"],
			["content", "messageCompact"]
		])
		await this.modules.wait()

		const MessageContent = await getModuleByDisplayName("MessageContent")

		const _this = this
		inject("quickreact-contents", MessageContent.prototype, "render", function (args) {
			const {renderButtons} = this.props

			if (!this.props.quickReactPatched && renderButtons) {
				this.props.quickReactPatched = true

				this.props.renderButtons = (e) => {
					const res = renderButtons(e)
					if (res.props.children) {
						_this.emojis.forEach(name => {
							res.props.children.props.children.unshift(
								React.createElement("img", {
									src: _this.nameToURL(name),
									alt: name,
									className: "star-reaction-btn", // using same class name as quickstar for easy 3rd party themes
									onClick: () => _this.modules.get("addReaction")(e.channel.id, e.message.id, {
										animated: false,
										name: _this.nameToUnicode(name),
										id: null
									})
								})
							)
						})
					}
					return res
				}
			}

			return args
		}, true)
		this.forceUpdate()
	}

	pluginWillUnload() {
		uninject("quickreact-contents")
		this.forceUpdate()
	}
}
