import React, { Component } from 'react'
import _ from 'lodash'
import qs from 'query-string'
import createHistory from 'history/createBrowserHistory'
import loader from './../imgs/loader.gif'
import cross from './../imgs/paid_no.png'
import tick from './../imgs/paid_yes.png'
import './../css/CoffeeRun.css'
import './../css/Transitions.css'
import db from './db'
import moment from 'moment'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

let CoffeeRunLists = db.ref('runList')
let bHistory = createHistory()
class App extends Component {

  state = {
    runLists: {},
    journey: null,
    currentTime: moment().unix(),
    displayState: 'hide',
    selectedOrder: ''
  }

  constructor() {
    super()
    this.updateCurrentTime = this.updateCurrentTime.bind(this)
  }

  componentWillMount() {
    CoffeeRunLists.on('value', snapshot => {
      snapshot.forEach(coffeeRun => {
        if (coffeeRun.val().timeZone === moment().format('Z')) {
          if ((coffeeRun.val().runTime + 10800) < this.state.currentTime) {
            coffeeRun.ref.remove()
            console.log(`removed`);
          }
          // console.log(`checked`);
        }
      })
    })
  }

  updateCurrentTime(){
    this.setState({ currentTime: moment().unix() })
  }


  updatePayStatus(orderId, payStatus) {
    let currentRunList = this.state.journey
    let setPayStatus = CoffeeRunLists.child(currentRunList).child('orderList').child(orderId).child('payStatus')

    if (!payStatus) {
      setPayStatus.set(true)
    } else {
      setPayStatus.set(false)
    }
  }

  updateCheckList(orderId, orderStatus) {
    let currentRunList = this.state.journey
    let setOrderStatus = CoffeeRunLists.child(currentRunList).child('orderList').child(orderId).child('status')

    if (!orderStatus) {
      setOrderStatus.set(true)
    } else {
      setOrderStatus.set(false)
    }
  }

  goToHome(e) {
    e.preventDefault()
    bHistory.push({ search: '' })
  }

  goToRun() {
    this.setState({
      journey: 'runner'
    })
  }

  goToRequestList() {
    this.setState({
      journey: 'sloth'
    })
  }

  goToRunList(e) {
    e.preventDefault()
    let runIdInput = this.refs.runIdInput
    let runs = this.state.runLists

    _.forEach(runs, (run, runId) => {
      if (runIdInput.value !== runId) {
          runIdInput.placeholder = `That run is long gone`
        } else {
          this.setState({
            journey: runIdInput.value
          })

          let currentRunList = this.state.runLists[runIdInput.value]

          if (this.state.currentTime < currentRunList.runTime) {
            bHistory.push({ search: `?run=${runIdInput.value}&orderForm=true`})
          } else {
            bHistory.push({ search: `?run=${runIdInput.value}&orderForm=false`})
          }
        }
    })
    runIdInput.value = ''
  }

  goToOrderForm(id) {
    let currentRunList = this.state.runLists[id]

    if (this.state.currentTime < currentRunList.runTime) {
      bHistory.push({ search: `?run=${id}&orderForm=true`})
    } else {
      bHistory.push({ search: `?run=${id}&orderForm=false`})
    }
  }

  addNewRun(e) {
    e.preventDefault()
    let newRunnerName = this.refs.newRunnerName
    let newRunTime = this.refs.newRunTime

    if (newRunnerName.value === '') {
      newRunnerName.placeholder = 'We need your runner name'
      newRunnerName.value = ''
    } else if (!isNaN(newRunnerName.value)) {
      newRunnerName.placeholder = 'Number goes in the next box'
      newRunnerName.value = ''
    } else if (!newRunnerName.value.match(/.*[a-zA-Z]+.*/) || !newRunnerName.value.match(/^[a-zA-Z]+$/)) {
      newRunnerName.placeholder = 'Characters only please'
      newRunnerName.value = ''
    } else if (newRunTime.value === '') {
      newRunTime.placeholder = 'How many minutes till you run?'
    } else if (newRunTime.value < 1 || newRunTime.value > 120) {
      newRunTime.placeholder = 'Funny, try between 1 - 120 minutes'
      newRunTime.value = ''
    } else {

      let addRunTime = Math.floor(parseFloat(newRunTime.value)*60)
      let prefRunTime = moment().add(addRunTime, 'seconds').unix()

      let newRunRef = CoffeeRunLists.push({
        runner: newRunnerName.value,
        runTime: prefRunTime,
        timeZone: moment().format('Z'),
        orderList: {}
      })

      bHistory.push({search: `?run=${newRunRef.key}`})

      newRunnerName.value = ''
      newRunTime.value = ''
    }
  }

  addNewOrder(e, id){
    e.preventDefault()

    let orderMessage = document.querySelector('#orderMessage')

    let newOrderName = this.refs.newOrderName
    let newOrderDrink = this.refs.newOrderDrink
    let newOrderOptions = [this.refs.newOrderOption1.value, this.refs.newOrderOption2.value, this.refs.newOrderOption3.value, this.refs.newOrderOption4.value, this.refs.newOrderOption5.value, this.refs.newOrderOption6.value, this.refs.newOrderOption7.value]


    if (newOrderName.value === '') {
      newOrderName.placeholder = 'We need your name please'
      newOrderName.value = ''
    } else if (!newOrderName.value.match(/.*[a-zA-Z]+.*/) || !newOrderName.value.match(/^[a-zA-Z]+$/)) {
      newOrderName.placeholder = 'Characters only please'
      newOrderName.value = ''
    } else if (newOrderDrink.value === 'regular') {
      orderMessage.innerHTML = 'Forgot your Coffee Choice?'
    } else {
      let i = newOrderOptions.length - 1
      while (i >= 0) {
        if (newOrderOptions[i] === 'regular') {
          newOrderOptions.splice(i, 1);
        }
        i -= 1;
      }

      CoffeeRunLists.child(id).child('orderList').push({
        status: false,
        name: newOrderName.value,
        drink: newOrderDrink.value,
        picky: newOrderOptions,
        payStatus: false
      })
      bHistory.push({search: `?run=${id}`})
      orderMessage.innerHTML = `Don't forget to say thanks!`
      document.querySelector('#orderForm').reset();
    }
    // newItemName.value = ''

  }

  closeOrderForm(id){
    bHistory.push({search: `?run=${id}`})
    document.querySelector('#orderForm').reset();
  }


  renderOrderbtn(runListid) {
    return(
      <button className='btn-fixed btn-add' onClick={() => this.goToOrderForm(runListid)}>+</button>
    )
  }

  renderShareLinks(runListid){
    return(
      <p>
        <span className="naked-link" onClick={() => this.shareViaMail(runListid)}>Share via Email</span> or <span className="naked-link" onClick={() => this.shareViaSMS(runListid)}>Send a message</span>
      </p>
    )
  }

  renderTitle() {
    return(
      <span onClick={(e) => this.goToHome(e)}>Coffee Run</span>
    )
  }

  renderPayStatus(payStatus) {
    if (!payStatus) {
      return <img className="orderStat-payStat" src={cross} alt="Not Paid"/>
    } else {
      return <img className="orderStat-payStat" src={tick} alt="Paid"/>
    }
  }

  rendertimePrompt(runTime){
    let countDown = Math.floor((runTime - this.state.currentTime)/60)

    if (this.state.currentTime < runTime) {
      switch (true) {
        case (countDown >= 41):
          return `going for a coffee run in about an hour`
          break
        case (countDown === 30):
          return `going for a coffee run in half an hour`
          break
        case (countDown >= 2):
          return `going for a coffee run in ${countDown} minutes`
          break
        default:
        return `going for a coffee run in a minute`
      }
    } else {
      switch (true) {
        case (countDown >= -20):
          return `Running`
          break
        default:
          return `Go get your own Coffee!`
      }

    }
  }

  renderHome() {
    return (
      <div className="CoffeeRun">
        <div className="visual-align">
          <div className="section-space">
              <h1 className="app-header">{this.renderTitle()}</h1>
              <p className="App-intro">
                 Anyone want a coffee?
              </p>
              <button className="app-btn app-btn--left" onClick={() => this.goToRun()}>I'm Running</button>
              <button className="app-btn app-btn--right" onClick={() => this.goToRequestList()}>Ordering</button>
          </div>
        </div>
      </div>
    );
  }

  renderRun() {
    return (
      <div className="CoffeeRun">
        <div className="visual-align">
          <div className="section-space">
            <h1 className="app-header">{this.renderTitle()}</h1>
            <form className="form-normalize" >
              <input className="fields-normalize" type="text" placeholder="Runner Name" ref="newRunnerName" required></input>
              <input className="fields-normalize" type="number" min="1" max="120" placeholder="Minutes to order" ref="newRunTime" required></input>
              <button className="button-full" type="submit" onClick={(e) => this.addNewRun(e)}>Start Run!</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  renderIdForm() {
    return (
      <div className="CoffeeRun">
        <div className="visual-align">
          <div className="section-space">
            <h1 className="app-header">{this.renderTitle()}</h1>
            <form className="form-normalize" >
              <input className="fields-normalize" type="text" placeholder="Enter Run ID" ref="runIdInput"></input>
              <button className="button-full" onClick={(e) => this.goToRunList(e)}>Let's Order!</button>
            </form>
            {/* <ul>
              {
                _.map(this.state.runLists, (list, id) => {
                  return <li onClick={() => this.goToOrderForm(id)} key={id}>{list.runner}</li>
                })
              }
            </ul> */}
          </div>
        </div>
      </div>
    );
  }

  shareViaMail(id) {
    let currentRunList = this.state.runLists[id]
    let thisPage = window.location.href
    let message = `Hey I'm ${this.rendertimePrompt(currentRunList.runTime)}.  \n
Click here - ${thisPage}&orderForm=true - to put your order in.\n
If the link doesn't work, to get your order on my run list.\n
go to this URL : https://kwanvero.github.io/coffeeRun\n
and use this id : ${id}\n
`
    let mailto_link = 'mailto:?subject=Going for a cofee run&body=' + encodeURIComponent(message);
    window.open(mailto_link, 'emailWindow')

  }

  shareViaSMS(id) {
    let currentRunList = this.state.runLists[id]
    let thisPage = window.location.href
    let message = `Hey I'm ${this.rendertimePrompt(currentRunList.runTime)}.  \n
Click here - ${thisPage}&orderForm=true - to put your order in.
`
    let smsto_link = 'sms:;?&body=' + encodeURIComponent(message);

    window.open(smsto_link)

  }


  renderList() {
    let id = this.state.journey
    let currentRunList = this.state.runLists[id]

    if (!currentRunList) {
      return <div className="CoffeeRun">
                <div className="visual-align">
                    <img src={loader} alt="Loading..."/>
                </div>
            </div>
    }

    return (
      <div className="CoffeeRun">
        { this.state.currentTime < currentRunList.runTime ? this.renderOrderbtn(id) : null }
        <div className="visual-align">
          <div className="section-space app-container">
            <h3 className="app-header">
              <span className="name-format">{currentRunList.runner}</span>'s {this.renderTitle()}
            </h3>
            <p>{this.rendertimePrompt(currentRunList.runTime)}</p>
            <ReactCSSTransitionGroup
            transitionName="example"
            transitionEnterTimeout={500}
            transitionLeaveTimeout={300}>
            { this.state.currentTime < currentRunList.runTime ? this.renderShareLinks(id) : null }
            </ReactCSSTransitionGroup>
            <p>{ this.state.currentTime < currentRunList.runTime ? id : null }</p>
            <hr/>
            <ul className="orderS">
            <ReactCSSTransitionGroup
            transitionName="example"
            transitionEnterTimeout={500}
            transitionLeaveTimeout={300}>
              {
                _.map(currentRunList.orderList, (order, orderId) => {
                  return  <li key={orderId} id={orderId} className="orderStats">
                            <div className="orderStats-pay" onClick={() => this.updatePayStatus(orderId, order.payStatus)}>{this.renderPayStatus(order.payStatus)}</div>
                            <div className="orderStats-ordering" key={order.status} onClick={() => this.updateCheckList(orderId, order.status)}>
                              <p className="order-name name-format">{order.name}</p>
                              <p className={!order.status ? "order-drink" : "order-drink ordered"}>{order.drink}</p>
                              <p className="order-picky">{ order.picky ? order.picky.join(' - ') : null }</p>
                            </div>
                          </li>
                })
              }
            </ReactCSSTransitionGroup>
            </ul>
          </div>
        </div>
        <div className={this.state.displayState}>
          <div className='popup'>
            <button className='close-btn btn-fixed' onClick={() => this.closeOrderForm(id)}>x</button>
            <h3 className="app-header">
              <span className="name-format">{currentRunList.runner}</span>'s {this.renderTitle()}
            </h3>
            <form id="orderForm" className="form-normalize app-container">
              <input className="fields-normalize" type="text" placeholder="Your Name *" ref="newOrderName" required></input>
              <select className="fields-normalize" ref="newOrderDrink" required>
                <optgroup label="Coffee">
                  <option defaultValue hidden value="regular">+ Coffee: *</option>
                  <option value="Cappuccino">Cappuccino</option>
                  <option value="Flat White">Flat White</option>
                  <option value="Latte">Latte</option>
                  <option value="Mocha">Mocha</option>
                  <option value="Chai Latte">Chai Latte</option>
                  <option value="Long Black">Long Black</option>
                  <option value="Espresso">Espresso</option>
                  <option value="Macchiato">Macchiato</option>
                  <option value="Piccolo">Piccolo</option>
                  <option value="Americano">Americano</option>
                  <option value="Dirty Chai">Dirty Chai</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="Chocolate">Chocolate</option>
                  <option value="Tea">Tea</option>
                </optgroup>
              </select>
              <select className="fields-normalize" ref="newOrderOption1">
                <option defaultValue hidden value="regular">+ Milk: Full Cream</option>
                <option value="regular">Full Cream</option>
                <option value="Skim">Skim</option>
                <option value="Soy">Soy</option>
                <option value="Almond">Almond</option>
                {/* <option value="Dash of Skim">Dash of Skim</option>
                <option value="Dash of Full Cream">Dash of Full Cream</option>
                <option value="Dash of Soy">Dash of Soy</option>
                <option value="Whip Cream">Whip Cream</option> */}
              </select>
              <select className="fields-normalize" ref="newOrderOption2">
                <option defaultValue hidden value="regular">+ Size: Regular</option>
                <option value="regular">Regular</option>
                <option value="Large">Large</option>
                <option value="Three Quarter">3/4</option>
              </select>
              <select className="fields-normalize" ref="newOrderOption3">
                <option defaultValue hidden value="regular">+ Strength: Regular</option>
                <option value="regular">Regular</option>
                <option value="Decaf">Decaf</option>
                <option value="Extra Shot">Extra Shot</option>
                <option value="Weak">Weak</option>
              </select>
              <select className="fields-normalize" ref="newOrderOption4">
                <option defaultValue hidden value="regular">+ Temp: Hot</option>
                <option value="regular">Hot</option>
                <option value="Extra Hot">Extra Hot</option>
                <option value="Warm">Warm</option>
                <option value="Ice">Ice</option>
                <option value="Frappe">Frappe</option>
              </select>
              <select className="fields-normalize" ref="newOrderOption5">
                <option defaultValue hidden value="regular">+ Blend: Regular</option>
                <option value="regular">Regular</option>
                <option value="House Blend">House Blend</option>
                <option value="Cold Drip">Cold Drip</option>
              </select>
              <select className="fields-normalize" ref="newOrderOption6">
                <option defaultValue hidden value="regular">+ Sugar: No</option>
                <option value="regular">0</option>
                <option value="Half Sugar">0.5</option>
                <option value="One Sugar">1.0</option>
                <option value="One and Half Sugar">1.5</option>
                <option value="Two Sugar">2.0</option>
                <option value="Three Sugar">3.0</option>
              </select>
              <select className="fields-normalize" ref="newOrderOption7">
                <option defaultValue hidden value="regular">+ Flavour: None</option>
                <option value="regular">None</option>
                {/* <option>White Chocolate</option>
                <option>Dark Chocolate</option> */}
                <option value="Vanilla Flavour">Vanilla</option>
                <option value="Caramel Flavour">Caramel</option>
                <option value="Hazelnut Flavour">Hazelnut</option>
                <option value="Honey Flavour">Honey</option>
              </select>
              {/* <select className="fields-normalize" ref="newOrderOption4" required>
                <option defaultValue hidden value="regular">+ Tea Choice: *</option>
                <option>English Breakfast</option>
                <option>Earl Grey</option>
                <option>Green</option>
                <option>Peppermint</option>
                <option>Camomile</option>
              </select> */}
              <button className="button-half btn-secondary app-btn app-btn--left" type="submit" onClick={(e) => this.addNewOrder(e, id)}>Add</button>
              <button className="button-half btn-secondary app-btn app-btn--right" type="reset">Reset</button>
            </form>
            <p id="orderMessage">{this.rendertimePrompt(currentRunList.runTime)}</p>
          </div>
        </div>
      </div>
    );
  }

  render() {

    if (this.state.journey === 'runner') {
      return this.renderRun()
    }
    if (this.state.journey === 'sloth') {
      return this.renderIdForm()
    }
    if (this.state.journey) {
      return this.renderList()
    }
    return this.renderHome()

  }


  componentDidMount() {
    setInterval(this.updateCurrentTime, 60000)

    CoffeeRunLists.on('value', snapshot => {
      this.setState({
        runLists: snapshot.val()
      })
    })

    let query = qs.parse(window.location.search)
    this.setState({
      journey: query.run
    })

    if(query.orderForm === 'true'){
      this.setState({
        displayState: 'popup-container'
      })
    }

    if(query.orderForm !== 'true'){
      this.setState({
        displayState: 'hide'
      })
    }

    bHistory.listen(location => {
      let query = qs.parse(location.search)
      this.setState({
        journey: query.run
      })

      if(query.orderForm === 'true'){
        this.setState({
          displayState: 'popup-container'
        })
      }

      if(query.orderForm !== 'true'){
        this.setState({
          displayState: 'hide'
        })
      }

    })
  }
}

export default App;
