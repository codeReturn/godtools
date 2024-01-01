import React, { useState, useContext, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
  useHistory,
  Link
} from 'react-router-dom';

import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword';
import ResetPasswordUpdate from './pages/ResetPasswordUpdate';
import Store from './pages/Store';
import Service from './pages/Service';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Deposits from './pages/Deposits'
import Account from './pages/Account';
import Status from './pages/Status';
import Whisper from './pages/Whisper';

import useSocket from './shared/util/socket';

import { AuthContext } from './shared/context/auth-context';
import { useAuth } from './shared/hooks/auth-hook';

import { ShopContext } from './shared/context/shop-context';
import { useShopHook } from './shared/hooks/shop-hook';

import { Container, Row, Col, Form, Button, Dropdown, Badge } from 'react-bootstrap';
import Sidebar from './shared/components/UIElements/Sidebar';

import './index.css'

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});


const App = () => {
  const { token, login, logout, userId } = useAuth();
  const socket = useSocket()
  const { addToCart } = useShopHook();

  let routes;

  if (token) {
    routes = (
      <Switch>
        <Route path="/" exact>
          <Store />
        </Route>
        <Route path="/service/:sid">
          <Service />
        </Route>
        <Route path="/search/:search">
          <Search />
        </Route>
        <Route path="/cart">
          <Cart />
        </Route>
        <Route path="/orders">
          <Orders />
        </Route>
        <Route path="/deposits">
          <Deposits />
        </Route>
        <Route path="/account">
          <Account />
        </Route>
        <Route path="/status">
          <Status />
        </Route>
        <Route path="/whisper">
          <Whisper />
        </Route>
        <Redirect to="/" />
      </Switch>
    );
  } else {
    routes = (
      <Switch>
        <Route path="/" exact>
          <Store />
        </Route>
        <Route path="/service/:sid">
          <Service />
        </Route>
        <Route path="/search/:search">
          <Search />
        </Route>
        <Route path="/resetpassword">
          <ResetPassword />
        </Route>
        <Route path="/resetpasswordupdate/:link">
          <ResetPasswordUpdate />
        </Route>
        <Route path="/status">
          <Status />
        </Route>
        <Route path="/auth">
          <Auth />
        </Route>
        <Redirect to="/" />
      </Switch>
    );
  }

  // search
  const history = useHistory();
  const [search, setSearch] = useState();

  const submitSearch = (e) => {
    e.preventDefault();

    if(!search){
      toast.error('Search input cant be empty!', {position: toast.POSITION.BOTTOM_CENTER})
      return;
    }

    window.location.href = `/search/${search}`
  }

  // cart count
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Function to update the cart count
    const updateCartCount = () => {
      if(!token) {
        setCartCount(0);
        return;
      }

      const cartList = JSON.parse(localStorage.getItem('cart_list'));
      if (cartList && Array.isArray(cartList)) {
        setCartCount(cartList.length);
      } else {
        setCartCount(0);
      }
    };

    // Initial cart count update
    updateCartCount();

    // Listen for the custom event to update the cart count when the cart is updated
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, [token]);

  useEffect(() => {
    if(token && socket)  {       
      socket.emit('join', {
        status: true,
        user: userId
      })
    }
  }, [token, socket]);
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!token,
        token: token,
        userId: userId,
        login: login,
        logout: logout
      }}
    >
    <ShopContext.Provider
      value={{
        addToCart: addToCart
      }}
    >
      <Router>
          <div className="app">
            <Container fluid>
              <Row className="flex-xl-nowrap">
                <Col as={ Sidebar } xs={ 12 } md={ 3 } lg={ 2 } />

                <Col xs={ 12 } md={ 9 } lg={ 10 }>
                    <div className="app-body">
                      
                    <Row>
                      <Col md={4}>
                          <Form onSubmit={submitSearch}>
                          <Form.Group className="mb-3 position-relative" controlId="searchGames">
                            <i className="fa-brands fa-searchengin searchicon"></i>
                            <Form.Control type="text" onChange={(e) => setSearch(e.target.value)} placeholder="Search for games" />
                          </Form.Group>
                          </Form>
                      </Col>
                      <Col md={{ span: 4, offset: 4 }}>
                        <div className="float-end">
                          <Link to={token ? '/cart' : '/auth?mode=register'}> <Button variant="dark" className="navbutton-custom position-relative"> <i className="fa-solid fa-cart-shopping"></i> <span className="cart-count">{cartCount}</span> </Button> </Link>
                          
                          {token ? (
                            <>
                            <Link to='#' onClick={logout}> <Button variant="danger" className="navbutton-custom"> Logout </Button> </Link>                        
                            </>
                          ) : (
                            <>
                            <a href='/auth?mode=login'> <Button variant="dark" className="navbutton-custom"> Login </Button> </a>
                            <a href='/auth?mode=register'> <Button variant="warning" className="navbutton-custom"> Sign up </Button> </a>                        
                            </>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <hr />

                    <div className="app-body-content">
                      {routes}
                    </div>

                    </div>
                </Col>
              </Row>
            </Container>
          </div>
      </Router>
    </ShopContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
