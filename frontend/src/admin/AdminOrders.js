import React, { useState, useEffect, useContext } from 'react';
import { useHistory, useLocation } from "react-router-dom";

import { AuthContext } from '../shared/context/auth-context';
import { useHttpClient } from '../shared/hooks/http-hook';

import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import { Modal, Table, Button, Form, FloatingLabel } from 'react-bootstrap';

import axios from 'axios';

import Paginate from '../shared/components/UIElements/Pagination';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});


const AdminOrders = () => {
    const auth = useContext(AuthContext);
    const { sendRequest, isLoading, error, clearError } = useHttpClient();

    const [loadedOrders, setLoadedOrders] = useState();
    const [totalArticles, setTotalArticles] = useState(0);
    const history = useHistory();

    const [page, setPage] = useState(1);
    const [requestedOnly, setRequestedOnly] = useState(false)

    const fetchOrders = async () => {        
        try {
            const responseData = await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/getorders?page=1&requested=${requestedOnly}`, 'GET',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            });
            
            setLoadedOrders(responseData.pageOfItems);
            setTotalArticles(responseData.pager.totalItems);
            setPage(responseData.pager.currentPage);
          } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
          }      
    };

    const requestPage = async (page) => {
        history.push({
           pathname: "/admin/orders",
           search: `?page=${page}`,
         });

         try {
           const responseData = await sendRequest(
               `http://localhost:5000/godtoolshost/api/admin/getorders?page=${page}&requested=${requestedOnly}`,
             'GET',
             null,
             {
                 Authorization: 'Bearer ' + auth.token
             }
           );
         
           setLoadedOrders(responseData.pageOfItems);
           setTotalArticles(responseData.pager.totalItems);
           setPage(responseData.pager.currentPage);
         } catch (err) {
             console.log(err)
         }
    };

    const location = useLocation().pathname;
    useEffect(() => {
        return () => clearError()
    }, [location.pathname, clearError]);


    useEffect(() => {
        fetchOrders()
    }, [requestedOnly]);

    const [orderInfo, setOrderInfo] = useState();
    const [orderAuthorInfo, setOrderAuthorInfo] = useState();
    const [show, setShow] = useState(false);
    const handleClose = () => {
        setShow(false);
        setOrderInfo('')
        setOrderAuthorInfo('')
    }
    const handleShow = async (id) => {
        setShow(true);
        const find = loadedOrders?.find((o) => o._id === id)
        setOrderInfo(find)

        const userInfo = await axios.get(`http://localhost:5000/godtoolshost/api/users/user/${find.author}`)
        setOrderAuthorInfo(userInfo.data.user)
    }

    const sendCodes = async (id) => {
        if(!setCodeTextarea){
            toast.error('Textarea is required!', {position: toast.POSITION.BOTTOM_CENTER})
            return;
        }

        try {
            await sendRequest(
                `http://localhost:5000/godtoolshost/api/admin/sendcodes`,
                'PATCH',
                JSON.stringify({
                    id: id,
                    message: codeTextarea
                }),
                {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + auth.token
                }
              );
  
          handleCloseCode()
          toast.success('Codes sended!', {position: toast.POSITION.BOTTOM_CENTER})
          fetchOrders()
        } catch (err) {
          toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }    
    }

    const [showCode, setShowCode] = useState(false);
    const [codeModalId, setCodeModalId] = useState();
    const [codeTextarea, setCodeTextarea] = useState();

    const handleCloseCode = () => {
        setCodeModalId('')
        setCodeTextarea('')
        setShowCode(false);
    }
    const handleShowCode = (id) => {
        setCodeModalId(id)
        setShowCode(true);
    }

    return (
        <>
        <Modal show={showCode} onHide={handleCloseCode}>
            <Modal.Header closeButton>
            <Modal.Title>Send codes</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form>
                <FloatingLabel controlId="floatingTextarea2" label="Codes">
                    <Form.Control
                    onChange={(e) => setCodeTextarea(e.target.value)}
                    as="textarea"
                    placeholder="Enter message and codes here"
                    style={{ height: '200px' }}
                    />
                </FloatingLabel>

                <Button variant="success" style={{ marginTop: "1rem" }} onClick={() => sendCodes(codeModalId)}> SEND </Button>
                </form>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseCode}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Order Informations</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="order-info-modal">
                {orderInfo && (
                    <>
                    <div className="order-info-block"> 
                        <label>ID:</label> <span>{orderInfo._id}</span> <hr />
                        <label>Total price:</label> <span style={{ fontWeight: 'bold', color:'#FCD434' }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(orderInfo.price)}</span> <hr />
                        <label>Status:</label> {orderInfo.status === true ? (
                            <>
                            <span style={{ color: 'green' }}> Paid </span>
                            </>
                        ) : (
                            <>
                            <span style={{ color: 'red' }}> Unpaid </span>
                            </>
                        )}

                        <hr />

                        <label>Total products:</label> {orderInfo?.products?.length} 

                        <hr />
                        
                        <span style={{ color: 'silver' }}> Client Informations </span> <br />
                        <label>Name:</label> {orderAuthorInfo?.name} <br />
                        <label>Email:</label> {orderAuthorInfo?.email}

                        <hr />
                        
                        <Table responsive className='custom-table-s'>
                        <thead>
                            <tr>
                            <th></th>
                            <th>Info</th>
                            </tr>
                        </thead>
                        <tbody>
                        {orderInfo.products && orderInfo.products.map((oi, index) => {
                            return (
                                <React.Fragment key={`oi` + index}>
                                <tr>
                                    <td className='text-center'>
                                    <img
                                        src={`http://localhost:5000/godtoolshost/${oi.product_info.image}`}
                                        alt={oi.product_info.name}
                                        className="img-fluid"
                                        style={{ maxHeight: '60px' }}
                                    />   
                                    </td>
                                    <td className='table-info-custom'>
                                        <span>Name:</span> {oi.product_info.name} <br />
                                        <span>Quantity:</span> {oi.quantity} <br />
                                        <span>Price:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(oi.product_info.price)}
                                    </td>
                                </tr>
                                </React.Fragment>
                            )
                        })}
                        </tbody>
                        </Table>        
                        
                        <h3>Total <br /> <b style={{ color: '#FCD434' }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(orderInfo.price)}</b></h3>
                    </div>

                    {orderInfo.request_message ? (
                        <>
                        <div className="order-info-message-last">
                            {orderInfo.request_message}
                        </div>
                        </>
                    ) : null}
                    </>
                )}
                </div>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>         

            <h1 className='custom-h1-title'><i className="fa-solid fa-money-check-dollar"></i> Orders</h1>
            <div className="checkbox-orders-acp">
            <Form.Check 
                type="switch"
                id="requested-switch"
                label="Requested codes orders"
                onChange={(e) => setRequestedOnly(e.target.checked)}
            />
            </div>   
            
            <center>
                {isLoading && <LoadingSpinner />}
            </center>

            {!isLoading && (
                <>
                <Table responsive className='custom-table-s'>
                <thead>
                    <tr>
                    <th></th>
                    <th>Info</th>
                    <th></th>
                    <th></th>
                    </tr>
                </thead>
                <tbody>
                {loadedOrders && loadedOrders.map((order, index) => {
                    return (
                        <React.Fragment key={`order` + index}>
                        <tr>
                            <td>
                                <div className='order-success position-relative'>
                                    {order.request_status === 1 && (
                                        <>
                                        <span className="position-absolute start-100 translate-middle badge rounded-pill bg-danger adminpillm">
                                            1
                                        </span>
                                        </>
                                    )}

                                    {order.request_status === 2 && (
                                        <>
                                        <span className="position-absolute start-100 translate-middle badge rounded-pill bg-success adminpillm">
                                            <i className="fa-solid fa-check"></i>
                                        </span>
                                        </>
                                    )}
                                    <i className="fa-solid fa-check-to-slot"></i>
                                </div>
                            </td>
                            <td className='table-info-custom'> 
                                <span>ID:</span> {order._id} <br />
                                <span>Total price:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.price)} <br />
                            </td>
                            <td className='table-info-custom'>
                                <span>Total products:</span> {order.products?.length} <br />
                                <span>Date:</span> {new Date(order.date).toLocaleString("lookup")}
                            </td>
                            <td>
                                <Button variant="warning" className="rounded-0" size="sm" onClick={() => handleShow(order._id)}> <i className="fa-solid fa-list"></i> </Button>
                                {order.request_status === 1 && (
                                        <>
                                        <Button variant="success" className="rounded-0" size="sm" onClick={() => handleShowCode(order._id)}> <i className="fa-solid fa-code"></i> </Button>
                                        </>
                                )}
                            </td>
                        </tr>
                        </React.Fragment>
                    )
                })}
                </tbody>
                </Table>
                </>
            )}

            {!isLoading && (
            <Paginate page={page} setPage={requestPage} totalArticles={totalArticles} maxButtons="2" maxPerPage="20" />
            )}
        </>
    )
}

export default AdminOrders;