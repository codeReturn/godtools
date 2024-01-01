import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter, Route, Switch} from 'react-router-dom';


import App from './App';
import Admin from './admin/Admin';

const basename = '/';

ReactDOM.render(
  <BrowserRouter basename={basename}>
    <Switch>

      <Route path="/admin">
        <Admin />
      </Route>
      
      <Route path="/">
        <App />
      </Route>
    </Switch>
  </BrowserRouter>
, document.getElementById('root'));