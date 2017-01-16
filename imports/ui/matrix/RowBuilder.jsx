import React, { Component, PropTypes } from 'react'

export default class RowBuilder extends Component {
  constructor(props) {
    super(props)

    this.state = {}
    this.onAddRow = this.onAddRow.bind(this)
    this.acceptRow = this.acceptRow.bind(this)
    this.cancelRow = this.cancelRow.bind(this)
  }

  renderRowBuilder() {
    if (this.state.buildingRow != true) {
      return (
        <div>
          <button onClick={this.onAddRow}>Add Row</button>
          <button onClick={this.cancelRow}>Delete Last Row</button>
        </div>
      )
    }
    const rowNum = this.props.mtx.length - 1
    return (
      <div>
        {this.props.mtx[0].map((col, i) => {
          return <div key={i}>
            <label>{col == null ? "Option" : col}</label>
            <input value={this.props.mtx[rowNum][i]} onChange={this.props.onChangeHandler(rowNum, i)} onClick={(e)=>e.target.select()}/>
            {col == null ? <div><br/>Variables: You can fill in values for this option here if you like,
              or you can modify them in the matrix directly at any time.
              Variables should be scored based on relative importance.
              Higher score means that it's a good desision.
              For example: if cost is a variable, an option with a relatively high cost should get a
              relatively low score in the cost column. If you're scoring variables on a 1-10 scale,
              an option with high cost might get a score of 1 while an option with a low cost might get a score of 10.
              Alternatively, you can write the actual cost in $ and give the cost column an appropriate negative weight to achieve the same effect.</div> : ''}
          </div>
        })}
        <br/>
        <button onClick={this.acceptRow}>Done</button>
        <button onClick={this.cancelRow}>Cancel</button>
      </div>
    )
  }

  render() {
    return (<div>
      <p><b>Row Builder</b>: Rows are for the different options you're considering. You should add a row for each.</p>
      {this.renderRowBuilder()}
    </div>)
  }

  onAddRow() {
    const { mtx } = this.props
    const newRow = []
    mtx[0].forEach(() => {
      newRow.push(0)
    })
    mtx.push(newRow)
    this.setState({buildingRow: true})
    this.props.changeMatrix(mtx)
  }

  acceptRow() {
    this.setState({buildingRow: false})
  }
  cancelRow() {
    const {mtx} = this.props
    if(mtx.length < 2) return
    mtx.pop()
    this.setState({buildingRow: false})
    this.props.changeMatrix(mtx)
  }
}
