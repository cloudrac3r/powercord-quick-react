const {React} = require('powercord/webpack');
const {Button} = require('powercord/components');
const {TextInput} = require('powercord/components/settings');

module.exports = class QuickReactSettings extends React.Component {
  constructor (props) {
    super(props);
    this.plugin = props.plugin;
    this.state = {
      emojis: this.plugin.emojis,
      name: "",
      nameIsValid: false
    }
  }

  apply() {
    this.plugin.saveSettings()
    this.plugin.forceUpdate()
    // ideally I'd clear the input in here, but I don't know how.
    this.setState({emojis: this.plugin.emojis, name: "", nameIsValid: false})
  }

  render () {
    return <div className="quickreact-settings">
      <h5 className='h5-18_1nd title-3sZWYQ size12-3R0845 height16-2Lv3qA weightSemiBold-NJexzi marginBottom8-AtZOdT marginTop40-i-78cZ'>
        Add emoji
      </h5>

      <div className="input-description">
        Write a default emoji name, then press the add button.
      </div>
      <div className="add-container">
        <TextInput
          style={!this.state.nameIsValid ? {borderColor: '#e22d2d'} : {borderColor: '#48c148'}}
          onChange={name => {
            this.setState({name, nameIsValid: !!this.plugin.nameToUnicode(name) && !this.plugin.emojis.includes(name)})
          }}
          // if I knew what I was doing, I would make it so pressing enter adds the item
        ></TextInput>
        <Button
          className="add-button"
          disabled={!this.state.nameIsValid}
          onClick={() => {
            const name = this.plugin.normaliseName(this.state.name)
            if (!this.plugin.nameToUnicode(name)) return
            if (this.plugin.emojis.includes(name)) return

            this.plugin.emojis.push(name)
            this.apply()
          }}
        >
          Add
        </Button>
      </div>

      <h5 className='h5-18_1nd title-3sZWYQ size12-3R0845 height16-2Lv3qA weightSemiBold-NJexzi marginBottom8-AtZOdT marginTop40-i-78cZ'>
        Emoji list
      </h5>
      {/* this flex makes the reaction grid not full width */}
      <div className="reaction-list-container">
        <div className="reaction-list">
          {this.state.emojis.map(name => <>
              <img src={this.plugin.nameToURL(name)}></img>
              <div>{name}</div>
              <img
                className="delete"
                src="https://cadence.moe/friends/discord_icons/pucross.svg"
                onClick={() => {
                  this.plugin.emojis = this.plugin.emojis.filter(n => n !== name)
                  this.apply()
                }}
              ></img>
            </>
          )}
        </div>
      </div>
    </div>
  }
};
