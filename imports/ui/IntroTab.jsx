import React, { Component, PropTypes } from 'react'
import Logo4 from './svg/Logo4'
import Note from './Note'
import { decisionStyles } from './matrix/Decision'


import colors from './colors'

const logoContainerStyles = {padding: '20px', width: '206', borderRadius: '30px', margin: '20px'}

export default class IntroTab extends Component {
    constructor (props) {
        super(props)

        this.checkEnter = this.checkEnter.bind(this)
    }
    render() {
        const textStyles = {color: colors.yellow, fontFamily: "'Varela Round', sans-serif", fontSize: '1.1em', marginLeft: '-23px'} //-35.5px
        return (<section style={{display: (this.props.selectedTab === 'intro' ? '' : 'none')}}>
            <header>
            <div style={{background: colors.orange, textAlign: 'center', padding: '20px', borderRadius: '20px', margin: '40px'}}>
                <Logo4 logoColor={colors.yellow} />
                <text style={textStyles}>hotPlot</text><br/>
                <div style={{...textStyles, marginLeft: '28px', fontSize: '8px', marginTop: '-5px'}}>plot your thoughts</div>
            </div>
            </header>
            <div style={{textAlign: 'center'}}>
                <h4 style={{color: colors.blue, margin: '0 10%'}}>
                    Make a hard decision now
                </h4><br/>
                <textarea value={this.props.decision} onChange={this.props.onChangeDecision} placeholder="Describe your decision in a few words" style={decisionStyles} onKeyPress={this.checkEnter} />
            </div>
            {this.props.renderTryit()}<br/>
            <h3 style={{color: colors.blue, textAlign: 'center'}}>Further Reading:</h3>
            <Note label='What Is' content="People make decisions based on many variables (often political), but communicate those decisions by telling a short story that hits on the one 'most important' point. This often involves stacking data or pointing out only what is most likely to get a thumbs up from the team."/>
            <Note label="What Could Be" content="Decisions can be documented and communicated in a transparent and objective way. Each consideration can be scored on a per option basis so that it's clear which option seems best now, and it's also clear how much better the option is (and why it's better). This means that it's straight forward to go back and re-evaluate the decision when circumstances change."/>
            <br/>
            <p style={{textAlign: 'center'}}>Use ThotPlot to improve decision making and communication for your team<br/><a target="_blank" href='https://medium.com/@river.kanies/thotplot-f87fb339db20'>Learn More</a></p>
            {this.props.renderTryit()}
        </section>)
    }

    checkEnter (e) {
        if (e.which == 13 || e.keyCode == 13) this.props.setTab('builder')()
    }
}