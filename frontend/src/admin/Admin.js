import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
  Link
} from 'react-router-dom';

import { Row, Col, Navbar, Nav } from 'react-bootstrap';

import { useAuth } from '../shared/hooks/auth-hook';
import { useHttpClient } from '../shared/hooks/http-hook';
import { AuthContext } from '../shared/context/auth-context';

import Noaccess from './Noaccess.js';

import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminServices from './AdminServices';
import AdminProducts from './AdminProducts';
import AdminTransactions from './AdminTransactions';
import AdminOrders from './AdminOrders';
import AdminArticles from './AdminArticles';
import AdminAffiliates from './AdminAffiliates';
import AdminLicenses from './AdminLicenses';

import useSocket from '../shared/util/socket'

const Admin = () => {
    const { token, login, logout, userId } = useAuth();
    const socket = useSocket();
    const { sendRequest } = useHttpClient();
    const [userInfo, setUserInfo] = useState();

    const fetchUser = async () => {
        try {
            const responseData = await sendRequest(
                `http://localhost:5000/godtoolshost/api/users/user/${userId}`
            )

            setUserInfo(responseData.user.rank);
            if(responseData.user.rank === 1) socket?.emit('join_admin')
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
          if(userId !== false && userId !== null) fetchUser()
    }, [userId, sendRequest]);

    let routes;

    if (token && userInfo === 1) { 
        routes = (
            <Switch>
              <Route path="/admin" exact>
                <AdminDashboard />
              </Route>
              <Route path="/admin/users">
                <AdminUsers />
              </Route>
              <Route path="/admin/services">
                <AdminServices />
              </Route>
              <Route path="/admin/products">
                <AdminProducts />
              </Route>
              <Route path="/admin/transactions">
                <AdminTransactions />
              </Route>
              <Route path="/admin/orders">
                <AdminOrders />
              </Route>
              <Route path="/admin/articles">
                <AdminArticles />
              </Route>
              <Route path="/admin/affiliates">
                <AdminAffiliates />
              </Route>
              <Route path="/admin/licenses">
                <AdminLicenses />
              </Route>
              <Route path="/noaccess">
                  <AdminDashboard />
              </Route>
              <Redirect to="/admin" />
            </Switch>
          );
    } else if(token && userInfo === 2) {
      routes = (
        <Switch>
          <Route path="/admin" exact>
            <AdminDashboard />
          </Route>
          <Route path="/admin/orders">
            <AdminOrders />
          </Route>
          <Route path="/noaccess">
              <AdminDashboard />
          </Route>
          <Redirect to="/admin" />
        </Switch>
      );
    } else {
        routes = (
            <Switch>
                <Route path="/noaccess">
                  <Noaccess />
                </Route>
                <Redirect to="/noaccess" />
          </Switch>
          );
    }

    const userJoined = () => {
      socket?.emit('join', {
          status: true,
          user: userId
      })
    }

    useEffect(() => {
      if(socket) userJoined();
    }, [])

    return (
      <>
        <AuthContext.Provider
          value={{
            isLoggedIn: !!token,
            token: token,
            userId: userId,
            login: login,
            logout: logout
          }}
        >
          <Router>

            {token && userId && (userInfo === 1 || userInfo === 2) ? (
                <>
                <div className="container mt-4">

                    <Row className="admin-row shadow">
                      <Col md="4" className="admin-nav">
                        <div className="admin-navdisplay">
                          <h1>ADMINPANEL</h1>

                          <hr />

                          <Navbar expand="lg" className="db-menu-update">
                          <Navbar.Toggle aria-controls="basic-navbar-nav" />
                          <Navbar.Collapse id="basic-navbar-nav">
                          <Nav className="me-auto w-100">

                          <ul className='w-100'>
                          <Link to='/admin'> <li> <i className="fas fa-chalkboard-teacher"></i> Dashboard</li> </Link>                          
                          <Link to='/admin/users'> <li> <i className="fa-solid fa-users"></i> Users</li> </Link>                          
                          <Link to='/admin/services'> <li> <i className="fa-solid fa-server"></i> Categories</li> </Link>                          
                          <Link to='/admin/products'> <li> <i className="fa-brands fa-product-hunt"></i> Products</li> </Link>                          
                          <Link to='/admin/orders'> <li> <i className="fa-solid fa-money-check-dollar"></i> Orders</li> </Link>    
                          <Link to='/admin/articles'> <li> <i className="fa-solid fa-newspaper"></i> Status </li> </Link>                      
                          <Link to='/admin/affiliates'> <li> <i className="fa-solid fa-handshake"></i> Affiliates </li> </Link>                      
                          <Link to='/admin/licenses'> <li> <i className="fa-solid fa-key"></i> Licenses </li> </Link>                      
                          <Link to='/' onClick={logout}> <li> <i className="fas fa-remove"></i> Logout</li> </Link>
                          </ul>
                          
                          </Nav>
                          </Navbar.Collapse>
                          </Navbar>

                        </div>
                      </Col>
                      <Col md="8" className="admin-main position-relative">
                        {routes}
                      </Col>
                    </Row>
                </div>
                </>
            ) : (
                    <main>{routes}</main>
            )}
            
          </Router>
        </AuthContext.Provider>
        </>
      );
};

export default Admin;