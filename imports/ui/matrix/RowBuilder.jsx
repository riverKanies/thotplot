import React, { Component, PropTypes } from 'react'

const inputId = 'new_option'

export default class RowBuilder extends Component {
  constructor(props) {
    super(props)

    this.state = {}
    this.onAddRow = this.onAddRow.bind(this)
    this.cancelRow = this.cancelRow.bind(this)
  }

  render() {
    const rowNum = this.props.mtx.length - 1
    const {mtx} = this.props
    const numRows = mtx.length     
    return (<div>
      <p><b>Add Options</b><br/>What are the (3) options you're considering. You should add an option (row) for each.</p>
      <label>Current Options:</label><br/>
      <ol>
        {mtx.map((row, i) => {
          if (i==0) return ''
          return <li key={i}>{row[0].val}{i==(numRows-1) ? <button onClick={this.cancelRow}>X</button>:''}</li>
        })}
      </ol>
      <input id={inputId} placeholder='ThotPlot' onClick={(e)=>e.target.select()}/>
      <button onClick={this.onAddRow}>Add</button><br/>
    </div>)
  }

  onAddRow() {
    const { mtx } = this.props
    const newRow = []
    mtx[0].forEach((col, i) => {
      //const val = (i==0) ? "ThotPlot" : 0
      const val = document.getElementById(inputId).value
      newRow.push({val: val, note: ''})
    })
    mtx.push(newRow)
    this.props.changeMatrix(mtx)
  }

  cancelRow() {
    const {mtx} = this.props
    if(mtx.length < 2) return
    mtx.pop()
    this.props.changeMatrix(mtx)
  }
}
