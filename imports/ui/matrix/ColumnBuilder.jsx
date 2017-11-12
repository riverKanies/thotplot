import React, { Component, PropTypes } from 'react'
import StepTitle from './StepTitle'
import colors from '../colors'


const inputId = 'new_consideration'

export default class ColumnBuilder extends Component {
  constructor(props) {
    super(props)

    this.state = {}

    this.addColumn = this.addColumn.bind(this)
    this.deleteColumn = this.deleteColumn.bind(this)
    this.toggleWeights = this.toggleWeights.bind(this)
  }

  renderWeightButtons(i) {
    const range = [1,2,3,5]
    const weight = this.props.weights[i]
    return range.map((wgt,j)=>{
      return <text key={j}>&#8195;<button style={{background: (weight == wgt) ? colors.blue : ''}} onClick={this.props.onChangeWeightHandler(i,wgt)}>{wgt}x</button></text>
    })
  }

  renderWeightSection() {
    if (!this.props.isWeightedMtx) return ''
    const labels = this.props.mtx[0]
    const { leastImportant } = this.state
    return <div>
      <p>Which consideration is least important?</p>
      <ul>
        {labels.map((labelObj,i)=>{
          if (i==0) return
          const isLeast = leastImportant == i
          const style = {background: (isLeast ? colors.blue : ''), color: (isLeast ? 'white' : ''), border: '1px solid lightgray', width: '100px', textAlign: 'center', borderRadius: '3px'}
          return <li key={i}><div onClick={this.setLeastImportant(i)} style={style}>{labelObj.val}</div></li>
        })}
      </ul>
      {(leastImportant)
        ? 
          <div>
            <p>Compared to <b style={{color: colors.blue}}>{labels[leastImportant].val}</b>, how important are the other considerations?</p>
            <ul>
              {labels.map((labelObj,i)=>{
                if (i==0) return
                if (i == leastImportant) return ''
                return <li key={i}>{labelObj.val}{this.renderWeightButtons(i)}</li>
              })}
            </ul>
          </div>
        : ''
      }
    </div>
  }

  render() {
    const colNum = this.props.mtx[0].length-1
    const {mtx} = this.props
    return (<div>
      <StepTitle title='Add Considerations' />
      <div style={{margin: '0 5%'}}>
        <p>
          What are the (3) most important considerations for your decision? Think about where your options differ significantly.
        </p>
        <label>Current Considerations:</label>
        <ol>
          {mtx[0].map((labelObj, i) => {
            const label = labelObj.val
            if (i==0) return ''
            return <li key={i}>{label}<button onClick={this.deleteColumn(i)} style={{marginLeft: '10px'}}>X</button></li>
          })}
        </ol>
        <input id={inputId} placeholder='time' onClick={(e)=>e.target.select()} />
        <button onClick={this.addColumn}>Add</button><br/>

        <p>All considerations are equally important: <input type='checkbox' checked={!this.props.isWeightedMtx} onChange={this.toggleWeights}/></p>
        {this.renderWeightSection()}
      </div>
    </div>)
  }

  addColumn() {
    const { mtx } = this.props
    mtx.map((row, i) => {
      const val = document.getElementById(inputId).value
      if (i==0) return row.push({val: val, note: ''})
      return row.push({val: 0, note: ''})
    })
    this.props.changeMatrix(mtx)
  }

  deleteColumn(i) {
    return () => {
      const { mtx } = this.props
      if (mtx[0].length < 2) return
      mtx.map((row) => {
        return row.splice(i,1)
      })
      this.setState({leastImportant: null})
      this.props.changeMatrix(mtx)
      this.props.removeWeights()
    }
  }

  toggleWeights(e) {
    const checked = e.target.checked
    if (checked) {
      this.props.removeWeights()
    } else {
      this.props.addWeights()
    }
  }

  setLeastImportant(i) {
    return () => {
      this.setState({leastImportant: i})
    }
  }

}
