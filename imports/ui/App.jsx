import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import AccountsUIWrapper from './AccountsUIWrapper.jsx';
import { Decisions } from '../api/decisions.js'
import MatrixBuilder from './matrix/MatrixBuilder.jsx'
import colors from './colors'

const cellColClass = 'col-2'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {}
    this.state.selectedTab = localStorage.getItem('mtxplayTab') || 'intro'

    const dec = props.decision
    if (dec) {
      this.state.decision = dec.decision
      this.state.mtx = dec.matrix
      this.state.isWeightedMtx = dec.isWeightedMatrix
      this.state.weights = dec.weights
    }else{
      this.state.decision = ""
      this.state.mtx = [
        [{val: null, note: null}]
      ]
      this.state.isWeightedMtx = false
      this.state.weights = []
    }
    this.state.userExists = null

    this.setTab = this.setTab.bind(this)

    this.onChangeHandler = this.onChangeHandler.bind(this)
    this.onChangeNote = this.onChangeNote.bind(this)
    this.onChangeDecision = this.onChangeDecision.bind(this)
    this.changeMatrix = this.changeMatrix.bind(this)
    this.addWeights = this.addWeights.bind(this)
    this.removeWeights = this.removeWeights.bind(this)
    this.onChangeWeightHandler = this.onChangeWeightHandler.bind(this)
    this.saveMatrix = this.saveMatrix.bind(this)
    this.updateMatrix = this.updateMatrix.bind(this)
    this.deleteMatrix = this.deleteMatrix.bind(this)
    this.shareMatrix = this.shareMatrix.bind(this)
    this.findUser = this.findUser.bind(this)
    this.addCollaboratorToDecision = this.addCollaboratorToDecision.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.decision == this.props.decision) return
    const dec = nextProps.decision
    if (!dec) return
    this.setState({decision: dec.decision, mtx: dec.matrix, isWeightedMtx: dec.isWeightedMatrix, weights: dec.weights})
  }

  renderDecisions() {
    return this.props.decisions.map((dec) => {
      const isCurrentDec = (this.props.decision && this.props.decision._id == dec._id)
      return <p key={dec._id}  style={isCurrentDec ? {color: 'blue'} : {}}>
        - {dec.decision}{isCurrentDec ? <button disabled style={{color: colors.blue}}>(viewing)</button> : <button onClick={this.goTo(`/decisions/${dec._id}`)}>View</button>}
        <button onClick={this.deleteMatrix(dec._id)}>Delete</button>
        {this.state.shareId == dec._id ? <button disabled style={{color: colors.blue}}>(open above)</button> : <button onClick={this.shareMatrix(dec._id)}>Collaborate</button>}
      </p>
    })
  }

  renderSharedDecisions() {
    return this.props.decisionsShared.map((dec) => {
      const isCurrentDec = (this.props.decision && this.props.decision._id == dec._id)
      return <p key={dec._id}  style={isCurrentDec ? {color: 'blue'} : {}}>
        - {dec.decision}{isCurrentDec ? ' (viewing)': <button onClick={this.goTo(`/decisions/${dec._id}`)}>View</button>}
      </p>
    })
  }

  renderRowOfLabels(row,i) {
    return row.map((cell, j) => {
      const styles = {background: colors.blue, width: '70px'}
      return <div key={j}>{this.renderCell(cell,i,j,styles)}</div>
    })
  }

  renderLabelRow() {
    const labelRow = this.state.mtx[0].concat([{val: `Score`}])
    return <div className='row hidden-when-small'>{this.renderRowOfLabels(labelRow,0)}</div>
  }

  renderOptionRows() {
    this.scores = []
    const bestI = this.bestOption(this.state.mtx).index
    return this.state.mtx.slice(1).map((row, i) => {
      const score = this.scoreRow(row)
      let rowScored = row.concat({val: score})
      this.scores.push({val: score})
      const styles = (bestI == i) ? {background: colors.yellow} : {}
      return <div  className='row' key={i} style={styles}>{this.renderRow(rowScored,i+1)}</div>
    })
  }

  renderRow(row,i) {
    return row.map((cell, j) => {
      const styles = (j==0) ? {background: colors.orange, width: '70px'} : {background: "lightgray", width: '20px'}
      return <div key={j}>{this.renderCell(cell,i,j,styles)}</div>
    })
  }

  renderCell(valObj,i,j,styles) {
    const val = valObj.val
    if (val === null) return <div className={cellColClass} />
    if (j >= this.numColumns()) return <div className={cellColClass} style={{textAlign: 'center', width: '70px', border: '1px solid black'}}><b>{val}</b></div>
    const note = this.state.mtx[i][j].note
    return <div className={cellColClass}>
      <div className='tooltipcontainer'>
        <input value={val} onChange={this.onChangeHandler(i,j)} style={styles}/>
        <span className='tooltip'>
          <textarea value={note} onChange={this.onChangeNote(i,j)} style={{color: 'white', background: 'black', border: '0px'}}/>
        </span>
      </div>
      {this.state.isWeightedMtx && j>0 && i>0 ? <text style={{fontSize: '.8em', margin: '8px 0px'}}>*{this.state.weights[j]}=<text>{val * this.state.weights[j]}</text></text> : ''}
      <text className='hidden-when-big' style={{color: colors.blue, marginLeft: '10px'}}>{this.state.mtx[0][j].val}</text>
    </div>
  }

  renderWeightsRow() {
    if (!this.state.isWeightedMtx) return <div className='row'><div className={cellColClass}><button onClick={this.addWeights}>Add Weights</button></div></div>
    return <div className='row'>{this.state.mtx[0].map((labelObj, i) => {
      const label = labelObj.val
      if (label == null) return <div className={cellColClass} key='0'>Weights<button onClick={this.removeWeights}>X</button></div>
      return (<div className={cellColClass} key={i}>
        <input value={this.state.weights[i]} onChange={this.onChangeWeightHandler(i)} style={{background: colors.purple, color: 'white', width: '20px'}}/>
        <text className='hidden-when-big' style={{color: colors.blue, marginLeft: '10px'}}>{this.state.mtx[0][i].val}</text>
      </div>)
    })}</div>
  }

  renderSaveMatrix() {
    if (!this.props.currentUser) return <button disabled="true">Save Plot (must be logged in)</button>
    const isCurrentPlot = !!Decisions.findOne({owner: this.props.currentUser._id, decision: this.state.decision})
    if (!isCurrentPlot) return <button onClick={this.saveMatrix}>Save New Plot</button>
    const userOwnedDec = Decisions.findOne({_id: this.props.routeDecisionId, owner: this.props.currentUser._id})
    if (userOwnedDec) return <button onClick={this.updateMatrix}>Update Plot</button>
    return <button disabled>(view your copy to edit)</button>
  }

  renderPlot() {
    const bestOption = this.bestOption(this.state.mtx)  
    const { mtx } = this.state
    if (mtx.length < 2 || mtx[0].length < 2) return <text style={{color: 'red'}}>Error, must have at least one option and one consideration!</text>
    return (<div>
      <div className='container' style={{border: '3px solid lightgray', borderRadius: '15px', padding: '10px 0', margin: '0', width: '100%'}}>
        {this.renderLabelRow()}
        {this.renderOptionRows()}
        {this.renderWeightsRow()}
      </div>
      <div style={{textAlign: 'center', width: '100%'}}>
        <b>Best: {bestOption.option}, Score: {bestOption.score}</b><br/>
        {this.renderSaveMatrix()}
      </div>
    </div>)
  }

  renderShare() {
    const id = this.state.shareId
    if (!id) return ''
    const dec = (Decisions.findOne(id))
    if (!dec) return ''
    const userExists = this.state.userExists
    const userExistsStatus = userExists ? <text style={{color: 'lightgreen'}}>Found!</text> : (userExists === false ? <text style={{color: 'red'}}>No such user!</text> : '')
    return <div style={{border: '2px solid lightgray', borderRadius: '5px', padding: '10px'}}>
      <p><b>Select Collaborators for: </b>{dec.decision}</p>
      <p>Decision Collaborators:</p>
      <ul>
        {dec.collaborators.map((email, i)=>{
          return <li key={i}>{email}<button onClick={this.removeCollaboratorFromDecision(email)}>X</button></li>
        })}
      </ul>
      <p>My Collaborators:</p>
      <ul>
        {Meteor.user().profile.collaborators.map((email, i)=>{
          return <li key={i}>
            {email}
            <button onClick={this.addCollaboratorToDecision(email)}>Add</button>
            <button onClick={this.removeCollaborator(email)}>X</button>
          </li>
        })}
      </ul>
      <label>Find Collaborators by Email:</label><br/>
      <input id='new_collaborator'/><br/>
      <button onClick={this.findUser}>Find</button>
      {userExistsStatus}<br/>
      <button onClick={this.addCollaborator}>Add to My Collaborators</button>
    </div>
  }

  renderNoDecision () {
    return <div>
      <h1>No such decision!</h1>
      <button onClick={this.goTo('/')}>Home</button>
    </div>
  }

  renderTab() {
    return (<div>
      <section style={{display: (this.state.selectedTab === 'intro' ? '' : 'none')}}>
        <header>
          <h1>About ThotPlot</h1>
        </header>
        <h4>
          ThotPlot makes it easy to communicate complicated decisions to your team so that you can spend less time in meetings and more time adding value to your business.
        </h4>
        <p><b>What is:</b> People make decisions based on any number of variables and political reasoning, then communicate those decisions by telling a short story that hits on the one 'most important' point. This often includes stacking data or pointing out only what is most likely to get a thumbs up from the team.</p>
        <p><b>What could be:</b> Decisions are documented and communicated in a transparent and objective way. Each consideration is weighed relatively and scored on a per option basis so that it's not just clear what option seems best now, but it's also clear how much better the option is for what reasons, and it's straight forward to go back and re-evaluate when circumstances change.</p>
        <p>Use ThotPlot to improve decision making and communication for your team: <button onClick={this.setTab('builder')}>Try It &#8680;</button></p>
      </section>
      <section style={{display: (this.state.selectedTab === 'builder' ? '' : 'none')}}>
        {this.props.routeDecisionId && !this.props.decision ?
          this.renderNoDecision() :
          <div>
            <MatrixBuilder
              decision={this.state.decision}
              mtx={this.state.mtx}
              onChangeHandler={this.onChangeHandler}
              onChangeNote={this.onChangeNote}
              changeMatrix={this.changeMatrix}
              onChangeDecision={this.onChangeDecision}
              setTab={this.setTab} />
          </div>}
      </section>
      <section style={{display: (this.state.selectedTab === 'matrix' ? '' : 'none')}}>
        {this.props.routeDecisionId && !this.props.decision ?
          this.renderNoDecision() :
          <div>
            <header>
              <h1>Decision</h1>
            </header>
            <p>This is the decision you are documenting. Feel free to edit it here:</p>
            <textarea value={this.state.decision} onChange={this.onChangeDecision}/>
            <header>
              <h1>Plot</h1>
            </header>
            <p>This is the final ThotPlot. It will automatically calculate overall scores whenever any values are changed. Feel free to edit any values here.</p>
            {this.renderPlot()}
            <br/><br/>
            <h3>Notes:</h3>
            <p><b>Scoring</b>: The values you fill in are simply summed for each option to determine the final overall score for that option.
            However, if you choose to add weights (by clicking 'Add Weights' at the bottom of the plot)
            each consideration column will be multiplied by its weight value when summed for the final score (weighted values are shown to the right of the non-weighted values).
            </p>
            <p><b>Self Review</b>: Look over your ThotPlot, paying special attention to the overall scores.
            Do the scores align with your intuition about which choice is best?
              If not, modify some of your scores to capture your intuition as best you can.
              Is there something relevant to the decision that you haven't yet made a consideration column for?
            </p>
          </div>}
      </section>
      <section style={{display: (this.state.selectedTab === 'list' ? '' : 'none')}}>
        <header>
          <h1>Decision List</h1>
        </header>
        {this.renderShare()}
        <p>My Decisions:</p>
        <ul>
          {this.renderDecisions()}
        </ul>
        <p>Shared With Me:</p>
        <ul>
          {this.renderSharedDecisions()}
        </ul>
      </section>
    </div>)
  }

  render() {
    const styles = {width: '100%', border: '2px solid lightgray', borderRadius: '5px', backgroundColor: 'lightgray', color: 'white', fontSize: '0.8em'}
    const stylesActive = { ...styles, borderColor: colors.blue, color: colors.blue, backgroundColor: 'white',}
    return (
      <div className="container">
        <div className="container" style={{background: colors.purple, margin: '0', width: '100%', padding: '10px 0'}}>
          <section className="row">
            <div className="col-4" style={{background: colors.blue, borderRadius: '5px', textAlign: 'center', height: '28px'}}><AccountsUIWrapper /></div>
            <div className="col-2"><button onClick={this.setTab('intro')} style={this.state.selectedTab === 'intro' ? stylesActive : styles}>Intro</button></div>
            <div className="col-2"><button onClick={this.setTab('builder')} style={this.state.selectedTab === 'builder' ? stylesActive : styles}>Builder</button></div>
            <div className="col-2"><button onClick={this.setTab('matrix')} style={this.state.selectedTab === 'matrix' ? stylesActive : styles}>Plot</button></div>
            <div className="col-2"><button onClick={this.setTab('list')} style={this.state.selectedTab === 'list' ? stylesActive : styles}>List</button></div>
          </section>
        </div>
        {this.renderTab()}
        <br/><br/><br/><br/><br/><br/>
      </div>
    )
  }

  setTab(l) {
    return ()=>{
      window.localStorage.setItem('mtxplayTab', l)
      this.setState({selectedTab: l})
    }
  }

  addWeights() {
    const weights = this.state.mtx[0].map(() => (1))
    this.setState({isWeightedMtx: true, weights: weights})
  }

  removeWeights() {
    this.setState({isWeightedMtx: false})
  }

  changeMatrix(mtx) {
    const {weights} = this.state
    if (this.state.weights.length < mtx[0].length) weights.push(1)
    this.setState({mtx: mtx, weights: weights})
  }

  onChangeHandler(i,j,score) {
    const { mtx } = this.state
    if (score || score === 0) {
      mtx[i][j].val = score
      this.setState({mtx: mtx})
      return
    }
    return (e) => {
      mtx[i][j].val = e.target.value
      this.setState({mtx: mtx})
    }
  }

  onChangeNote(i,j) {
    return (e) => {
      const { mtx } = this.state
      mtx[i][j].note = e.target.value
      this.setState({mtx: mtx})
    }
  }

  onChangeDecision(e) {
    this.setState({decision: e.target.value})
  }

  onChangeWeightHandler(i) {
    return (e) => {
      const { weights } = this.state
      weights[i] = e.target.value
      this.setState({weights: weights})
    }
  }

  numColumns() {
    return this.state.mtx[0].length
  }

  scoreRow(row) {
    return !this.state.isWeightedMtx ?
      row.slice(1).reduce((a,b) => (parseInt(a)+parseInt(b.val)), 0) :
      row.slice(1).reduce((a,b,j) => (parseInt(a)+parseInt(b.val)*this.state.weights[j+1]), 0)
  }

  bestOption(mtx) {
    if (mtx.length < 2) return {}
    const scored = mtx.slice(1).map((row, i) => {
      const score = this.scoreRow(row)
      return {option: row[0].val, index: i, score: score}
    })
    return scored.reduce((a,b) => {
      if (a.score > b.score) return a
      return b
    })
  }

  saveMatrix() {
    const decision = {
      decision: this.state.decision,
      matrix: this.state.mtx,
      isWeightedMatrix: this.state.isWeightedMtx,
      weights: this.state.weights
    }
    Meteor.call('decisions.insert', decision)
  }

  updateMatrix () {
    const decision = {
      id: this.props.routeDecisionId,
      matrix: this.state.mtx,
      isWeightedMatrix: this.state.isWeightedMtx,
      weights: this.state.weights
    }
    Meteor.call('decisions.update', decision)
  }

  deleteMatrix(id) {
    return () => {
      const confirmed = confirm('Are you sure you want to delete this decision?')
      if (confirmed) Meteor.call('decisions.remove', id)
    }
  }

  shareMatrix(id) {
    return () => {
      this.setState({shareId: id})
    }
  }

  findUser() {
    const email = document.getElementById('new_collaborator').value
    Meteor.call('users.find', email, (error, userExists)=>{
      this.setState({userExists})
    })
  }

  addCollaborator() {
    const email = document.getElementById('new_collaborator').value
    Meteor.call('users.addCollaborator', email)
  }

  removeCollaborator(email) {
    return () => {
      Meteor.call('users.removeCollaborator', email)
    }
  }

  addCollaboratorToDecision(email) {
    return () => {
      Meteor.call('decisions.addCollaborator', email, this.state.shareId)
    }
  }

  removeCollaboratorFromDecision(email) {
    return () => {
      Meteor.call('decisions.removeCollaborator', email, this.state.shareId)
    }
  }

  goTo(path) {
    return () => FlowRouter.go(path)
  }
}

App.propTypes = {
  decisions: PropTypes.array.isRequired,
}

export default createContainer(() => {
  Meteor.subscribe('decisions')
  Meteor.subscribe('decisionsShared')
  const currentUser = Meteor.user()
  const email = currentUser ? currentUser.emails[0].address : ''
  return {
    routeDecisionId: FlowRouter.getParam('_id'),
    decision: Decisions.findOne({_id: FlowRouter.getParam('_id')}),
    currentUser: currentUser,
    decisions: Decisions.find({owner: (currentUser||{})._id}).fetch(),
    decisionsShared: Decisions.find({collaborators: email}).fetch(),
  }
}, App)
