import React, { useState, useEffect, useContext } from 'react';

import { AuthContext } from '../shared/context/auth-context';
import { useHttpClient } from '../shared/hooks/http-hook';

import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import { Row, Col } from 'react-bootstrap'; 

import AdminWhisper from './components/AdminWhisper';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const AdminDashboard = () => {
    const auth = useContext(AuthContext);
    const { sendRequest, isLoading, error } = useHttpClient();

    const [stats, setStats] = useState();
    const fetchStats = async () => {        
        try {
            const responseData = await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/getstats`, 'GET',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            });
            
            setStats(responseData)
          } catch (err) {
            console.log(err)
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
          }      
    };

    useEffect(() => {
        fetchStats()
    }, []);    

    return (
        <>
        <h1 className='custom-h1-title'>Dashboard</h1>

        <center>
            {isLoading && <LoadingSpinner />}
        </center>

        {!isLoading && stats && (
            <>
            <h3 style={{ color: 'silver', fontWeight: '300' }}>General Statistics</h3>
            <Row className="mt-4">
                <Col sm={3}>
                    <div className="dashboard-stats-block">
                        <h2>{stats.users_count}</h2> <hr />
                        <p>Total users</p>
                    </div>
                </Col>

                <Col sm={3}>
                    <div className="dashboard-stats-block">
                        <h2>{stats.services_count}</h2> <hr />
                        <p>Total categories</p>
                    </div>
                </Col>

                <Col sm={3}>
                    <div className="dashboard-stats-block">
                        <h2>{stats.products_count}</h2> <hr />
                        <p>Total products</p>
                    </div>
                </Col>

                <Col sm={3}>
                    <div className="dashboard-stats-block">
                        <h2>{stats.orders_count}</h2> <hr />
                        <p>Total orders</p>
                    </div>
                </Col>

                <Col sm={3}>
                    <div className="dashboard-stats-block">
                        <h2>{stats.articles_count}</h2> <hr />
                        <p>Total statuses</p>
                    </div>
                </Col>

                <Col sm={3}>
                    <div className="dashboard-stats-block">
                        <h2>{stats.affiliates_count}</h2> <hr />
                        <p>Total affiliates</p>
                    </div>
                </Col>

                <Col sm={3}>
                    <div className="dashboard-stats-block">
                        <h2>{stats.licenses_count}</h2> <hr />
                        <p>Total licenses</p>
                    </div>
                </Col>
            </Row>

            <hr />

            <AdminWhisper />
            </>
        )}
        </>
    )
}

export default AdminDashboard;