import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useHttpClient } from '../shared/hooks/http-hook';

import { Row, Col, Button } from 'react-bootstrap';

import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const Store = () => {
    const { sendRequest, isLoading, error } = useHttpClient()

    const [services, setServices] = useState([]);

    const fetchServices = async () => {
        try {
            const responseData = await sendRequest('http://localhost:5000/godtoolshost/api/app/getservices')
            setServices(responseData.services)
        } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    }

    useEffect(() => {
        fetchServices()
    }, []);

    return (
        <>
            <div className="app-body-content">
              <h1><i className="fa-solid fa-store"></i> Store</h1>

              <center>{isLoading && <LoadingSpinner />}</center>


              <Row className="mt-2">
              {!isLoading && services && services.map((s, index) => {
                return (
                    <React.Fragment key={`s` + index}>
                        <Col sm={3}>
                            <div className="customblock">
                            <div className="customblock-image">
                                <img src={`http://localhost:5000/godtoolshost/${s.image}`} className="img-fluid" />
                            </div>

                            <div className="customblock-info">
                                <h3>{s.name}</h3>
                                <div className="customblock-info-price"> Total products: <span>{s.products.length}</span> </div>
                            </div>

                            <Link to={`/service/${s._id}`}>
                            <Button variant="warning" className="w-100" size="lg"><i className="fa-solid fa-arrow-right"></i></Button>
                            </Link>
                            </div>
                        </Col>
                    </React.Fragment>
                )
              })}
              </Row>
            </div>
        </>
    )
}

export default Store;