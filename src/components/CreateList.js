import React, { Component } from 'react';
import logo from './../../imgs/logo_01.png';
import './../../css/App.css';

class CreateList extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Coffee Run</h2>
        </div>
        <form>
          <lable></lable>
          <input></input>
        </form>
      </div>
    );
  }
}

export default CreateList;
