import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useHttpClient } from '../shared/hooks/http-hook';

import { Row, Col, Button, Modal, Form } from 'react-bootstrap';
import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import { AuthContext } from '../shared/context/auth-context';
import { useShopHook } from '../shared/hooks/shop-hook';

import axios from 'axios';

import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';


const Service = () => {
    const auth = useContext(AuthContext);
    const [loadedService, setLoadedService] = useState();
    const { isLoading, error, sendRequest } = useHttpClient();
    const { addToCart } = useShopHook();

    const [axiosLoading, setAxiosLoading] = useState(false)

    const sid = useParams().sid;

    const fetchService = async () => {
        try {
            const responseData = await sendRequest(`http://localhost:5000/godtoolshost/api/app/getservicebyid/${sid}`)

            console.log(responseData)
            if(responseData.page === null){
                window.location.href = "/"
            } else {
                setLoadedService(responseData.service)
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchService()
    }, [sid]);


    const [productInfo, setProductInfo] = useState();
    const [itemQuantity, setItemQuantity] = useState(1)

    const [totalPrice, setTotalPrice] = useState(0);
    const [totalPriceDiscount, setTotalPriceDiscount] = useState(0)

    const [show, setShow] = useState(false);
    const handleClose = () => {
        setShow(false);

        setItemQuantity(1)
        setTotalPrice(0)
        setTotalPriceDiscount(0)

    }
    
    const handleShow = () => setShow(true);

    const [inCart, setInCart] = useState(false);

    const PreviewProduct = async (id) => {
        const cartStorage = JSON.parse(localStorage.getItem('cart_list'));

        setItemQuantity(1)

        setInCart(false)

        handleShow()
        setAxiosLoading(true)

        try {
            const responseData = await axios.get(`http://localhost:5000/godtoolshost/api/app/getproductbyid/${id}`)
            setProductInfo(responseData.data.product);
            
            const discountedPrice = calculateDiscountedPrice(responseData.data.product, itemQuantity);
            setTotalPrice(responseData.data.product.price);
            setTotalPriceDiscount(discountedPrice);

            const find = cartStorage?.find((item) => item.id === responseData.data.product._id)
            if(find) setInCart(true)
        } catch (err) {
            console.log(err)
        } finally {
                setAxiosLoading(false)
        }
    }

    const calculateDiscountedPrice = (item, q) => {
        const quantity = parseInt(q); 
        const borders = item.borders || [];
        let percentageDiscount = 0;
      
        for (const border of borders) {
            console.log(border)
          if (quantity >= border.start && quantity <= border.end) {
            percentageDiscount = border.percentage;
            break;
          }
        }
      
        const discountedPrice = item.price - (item.price * percentageDiscount) / 100;
        return percentageDiscount !== 0 ? discountedPrice : item.price;
      };
      

    const updateQuantity = (value) => {
        const discountedPrice = productInfo?.borders ? calculateDiscountedPrice(productInfo, value) : productInfo?.price

        setItemQuantity(value)
        const totalPriceConst = productInfo?.price * parseInt(value);
        setTotalPrice(totalPriceConst)


        const totalPriceDiscountCost = discountedPrice * parseInt(value);
        setTotalPriceDiscount(totalPriceDiscountCost)
    }

    return (
        <>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Product Informations</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <center>
                {axiosLoading && <LoadingSpinner />}
                </center>
                    

                {!axiosLoading && productInfo && (
                    <>
                    <div className="modal-product-preview">

                    {productInfo.active === true ? (
                        <>
                        <span style={{ color: 'green' }}>ACTIVE</span>
                        </>
                    ) : (
                        <>
                        <span style={{ color: 'red' }}>INACTIVE</span>
                        </>
                    )}

                    <br />

                    <center> <img src={`http://localhost:5000/godtoolshost/${productInfo.image}`} style={{ maxHeight: '250px' }} className="img-fluid m-4" /> </center>
                    <h3>{productInfo.name}</h3>
                    <p className="product-pretty">{productInfo.description}</p>

                    <h1>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(productInfo.price)}</h1>
                    </div>

                    <hr />

                    {productInfo.active === false ? (
                        <>
                        <div className="alert alert-danger" role="alert">
                        Item is not active!
                        </div>                        
                        </>
                    ) : (
                        <>
                        {inCart === true ? (
                            <>
                            <div className="alert alert-success" role="alert">
                            Item added successfully
                            </div>
                            </>
                        ) : (
                            <>
                            <div className="form-addtocart">
                                <Row>
                                    <Col sm={7}>
                                    <Form.Group className="mb-3" controlId="formBasicEmail">
                                        <Form.Label>Quantity:</Form.Label>
                                        <RangeSlider
                                        value={itemQuantity}
                                        onChange={(e) => updateQuantity(e.target.value)}
                                        variant="warning"
                                        min={1}
                                        max={100}
                                        />
                                    </Form.Group>
                                    </Col>
                                    <Col sm={5}>
                                        <label>Price:</label>
                                        {itemQuantity >= 5 && <h3 style={{textDecoration: 'line-through'}}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice)}</h3> }
                                        <h3>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPriceDiscount)}</h3>
                                    </Col>
                                </Row>

                                <Button variant="success" size="lg" className='w-100' onClick={(e) => {
                                    addToCart(productInfo._id, itemQuantity)
                                    PreviewProduct(productInfo._id)
                                }}> ADD TO CART </Button>
                            </div>                        
                            </>
                        )}
                        </>
                    )}
                    
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>

        <div className="service-page">
            <center>
            {isLoading && <LoadingSpinner />}
            </center>

            {!isLoading && loadedService && (
                <>
                <div className="service-bg">
                    <img src={`http://localhost:5000/godtoolshost/${loadedService.image}`} className="img-fluid" />
                </div>
    
                    <h1>{loadedService.name}</h1>
                    <p>{loadedService.description}</p>

                <hr />

                <h3>Products</h3>
                {loadedService.products.length < 1 && (
                    <>
                    No results!
                    </>
                )}

                <Row>
                {loadedService.products && loadedService.products.map((p, index) => {
                    return (
                        <React.Fragment key={`p` + index}>
                            <Col sm={3}>
                                <div className="customblock">
                                <div className="customblock-image">
                                    <img src={`http://localhost:5000/godtoolshost/${p.image}`} className="img-fluid" />
                                </div>

                                <div className="customblock-info">
                                    <h3>{p.name}</h3>
                                    <div className="customblock-info-price"> Price: <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.price)}</span> </div>
                                </div>

                                {auth.token && (
                                    <>
                                    <Button variant="warning" className="w-100" size="lg" onClick={() => PreviewProduct(p._id)}><i className="fa-solid fa-cart-plus"></i></Button>                                    
                                    </>
                                )}
                                </div>
                            </Col>
                        </React.Fragment>
                    )
                })}
                </Row>
                </>
            )}
        </div>
        </>
    )
}

export default Service;