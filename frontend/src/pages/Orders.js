import React, { useState, useEffect, useContext } from 'react';

import { useHttpClient } from '../shared/hooks/http-hook';
import { AuthContext } from '../shared/context/auth-context';

import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import { Table, Button, Modal } from 'react-bootstrap';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const Orders = () => {
    const auth = useContext(AuthContext);

    const { sendRequest, isLoading, error } = useHttpClient()
    const [orders, setOrders] = useState([])

    const fetchOrders = async () => {
        try {
            const responseData = await sendRequest(`http://localhost:5000/godtoolshost/api/app/getuserorders`, 'GET', null, {
                Authorization: 'Bearer ' + auth.token
            })

            setOrders(responseData.orders)
            console.log(responseData.orders)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, []);

    const [orderInfo, setOrderInfo] = useState();
    const [show, setShow] = useState(false);
    const handleClose = () => {
        setShow(false);
        setOrderInfo('')
    }
    const handleShow = (id) => {
        setShow(true);
        const find = orders?.find((o) => o._id === id)
        setOrderInfo(find)
    }

    const requestCodes = async (id) => {
        try {
            await sendRequest(
                `http://localhost:5000/godtoolshost/api/app/requestcodes`,
                'PATCH',
                JSON.stringify({
                    id: id
                }),
                {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + auth.token
                }
            );
  
          toast.success('Successful requested codes!', {position: toast.POSITION.BOTTOM_CENTER})
          fetchOrders()
        } catch (err) {
          toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
          console.log(err)
          alert(error)
          
        }      
    }

    return (
        <>
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
                        <label>Total price:</label> <span style={{ fontWeight: 'bold', color:'#FCD434' }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(orderInfo.price)}</span> <br />
                        {orderInfo.crypto_info && (
                        <>
                        <label>Total crypto price:</label> <span style={{ fontWeight: 'bold', color:'#FCD434' }}>{orderInfo.crypto_info.amount} {orderInfo.crypto_info.token}</span>
                        </>)} <hr />
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

                        {orderInfo.request_message ? (
                        <>
                        <hr />
                        <div className="order-info-message-last">
                            <b>GodTools Support</b> <br />
                            {orderInfo.request_message}
                        </div>
                        </>
                        ) : null}
                    </div>
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

        <div className="app-body-content">
            <h1><i className="fa-solid fa-money-check-dollar"></i> Orders</h1>

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
                {orders && orders.map((order, index) => {
                    return (
                        <React.Fragment key={`order` + index}>
                        <tr>
                            <td className="position-relative">    
                                {order.request_status === 1 && (
                                    <>
                                    <span className="badge rounded-pill bg-warning custompillm"> requested codes </span>
                                    </>
                                )}
                                <div className='order-success position-relative'>
                                    {order.request_status === 2 && (
                                        <>
                                        <span className="position-absolute start-100 translate-middle badge rounded-pill bg-success adminpillm">
                                            1
                                        </span>
                                        </>
                                    )}
                                    <i className="fa-solid fa-check-to-slot"></i>
                                </div>
                            </td>
                            <td className='table-info-custom'> 
                                <span>ID:</span> {order._id} <br />
                                <span>Total price:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.price)} <br />
                                {order.address && (
                                    <>
                                    <span>Address:</span> {order.address}
                                    </>
                                )}
                            </td>
                            <td className='table-info-custom'>
                                <span>Total products:</span> {order.products?.length} <br />
                                <span>Date:</span> {new Date(order.date).toLocaleString("lookup")}
                            </td>
                            <td>
                                <Button variant="warning" size="sm" onClick={() => handleShow(order._id)}> <i className="fa-solid fa-list"></i> </Button>

                                {/* {order.request_status === 0 && order.status === true && (
                                    <>
                                    <Button variant="success" style={{ marginLeft: "0.5rem" }} size="sm" onClick={() => requestCodes(order._id)}> request codes </Button>
                                    </>
                                )} */}
                            </td>
                        </tr>
                        </React.Fragment>
                    )
                })}
                </tbody>
                </Table>
                </>
            )}
        </div>
        </>
    )
}

export default Orders;