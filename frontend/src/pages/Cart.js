import React, { useEffect, useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';

import { AuthContext } from '../shared/context/auth-context';

import { useHttpClient } from '../shared/hooks/http-hook';
import { useShopHook } from '../shared/hooks/shop-hook';

import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import { Table, Button, Modal, Form, ButtonGroup } from 'react-bootstrap';

import { PayPalButton } from "react-paypal-button-v2";

// web3
import Web3 from 'web3';

import QRCode from 'react-qr-code';
import axios from 'axios';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const Cart = () => {
    const auth = useContext(AuthContext);

    const userData = localStorage.getItem('userData')
    const parseData = JSON.parse(userData)

    const { sendRequest, isLoading, error } = useHttpClient()
    const { deleteFromCart, clearCart, cartList } = useShopHook()

    const [paymentStatus, setPaymentStatus] = useState(false);
    const history = useHistory()

    const [products, setProducts] = useState([])

    const fetchProducts = () => {
        const list = JSON.parse(localStorage.getItem('cart_list')) || cartList || [];

        Promise.all(list.map(async (product) => {
            const response = await sendRequest(
              `http://localhost:5000/godtoolshost/api/app/getproductbyid/${product.id}`
            );
            const product_info = await response.product;
            
            if(product_info){
                return {
                    ...product,
                    product_info
                };
            } else {
                return {
                    ...product,
                    product_info: null
                };
            }
        })
        ).then((products) => {
            const filter = products.filter((pf) => pf.product_info !== null)
            setProducts(filter)
        });
    }

    useEffect(() => {
        fetchProducts()
    }, []);

    let totalPriceOrder = 0;
    let totalPriceWithoutDiscount = 0;

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const finishOrderProcess = async () => {
        handleClose()

        try {
            const responseData = await sendRequest(
            `http://localhost:5000/godtoolshost/api/app/createorder`,
            'POST',
            JSON.stringify({
                    products: products,
                    price: totalPriceOrder,
                    status: paymentStatus
            }),
            {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + auth.token
            })
            
            if(responseData.item){
                localStorage.setItem('cart_list', JSON.stringify([]))
                toast.success('Order created!', {position: toast.POSITION.BOTTOM_CENTER})
                history.push('/orders')
            }
            
        } catch (err) {
            console.log(err)
            toast.error('Payment failed!', {position: toast.POSITION.BOTTOM_CENTER})
        }
    }

    // web3
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState(null);
    const [balance, setBalance] = useState(0);
    const [authorAddress, setAuthorAddress] = useState('0x85F0D268E465Bc57E07382e7Cf50aec3aeB22Ab1');
    const [ethUsdRate, setEthUsdRate] = useState(0);
    const [payDisabled, setPayDisabled] = useState(false)

    const fetchEthUsdRate = async () => {
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        setEthUsdRate(response.data.ethereum.usd);
    };
    useEffect(() => {
      fetchEthUsdRate();
    }, []);
  
    const initializeWeb3 = async () => {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum);
          setWeb3(web3);
          await window.ethereum.enable();
          const accounts = await web3.eth.getAccounts();
          setAccount(accounts[0]);
          const balance = await web3.eth.getBalance(accounts[0]);
          setBalance(web3.utils.fromWei(balance, 'ether'));
        }
    };

    const handlePaymentWeb3 = async () => {
        setPayDisabled(true)

        const etherValue = totalPriceOrder / ethUsdRate;
        const etherValueFixed = Number(etherValue.toFixed(18)); // rounding to 18 decimal places
        const weiValue = web3.utils.toWei(etherValueFixed.toString(), 'ether');
    
        try {
            const transaction = await web3.eth.sendTransaction({
                from: account,
                to: authorAddress,
                value: weiValue,
            });
    
            if (transaction.transactionHash) {
                setPaymentStatus(true)
                finishOrderProcess()
            }
        } catch (err) {
            setPayDisabled(false)
        }
    };

    const [itemQInfo, setItemQInfo] = useState();
    const [itemQInput, setItemQInput] = useState();

    const updateItemQuantity = (event) => {
        event.preventDefault()

        if (!itemQInput || isNaN(itemQInput)) {
          toast.error(`Item quantity is empty or not a number!`, { position: toast.POSITION.BOTTOM_CENTER });
          return;
        }        

        const localList = JSON.parse(localStorage.getItem('cart_list'))
        const obj = localList.findIndex((item => item.id == itemQInfo?.id))
        localList[obj].quantity = itemQInput

        localStorage.setItem('cart_list', JSON.stringify(localList))
        handleCloseQuantity()
        fetchProducts()
    }

    const [showQuantity, setShowQuantity] = useState(false);

    const handleCloseQuantity = () => {
        setShowQuantity(false);
        setItemQInfo('')
        setItemQInput('')
    }

    const handleShowQuantity = (id) => {
        setShowQuantity(true);

        const find = products.find((p) => p.id === id)
        if(find) setItemQInfo(find)
    }

    // blockcypher API
    const [paymentAddress, setPaymentAddress] = useState('');
    const [currentToken, setCurrentToken] = useState('');
    const [availableTokens, setAvailableTokens] = useState([]);
    const [currentTokenPrice, setCurrentTokenPrice] = useState(0);
    const [toPay, setToPay] = useState()
  
    // Fetch available tokens from BlockCypher API
    const fetchAvailableTokens = async () => {
    try {
        const response = await axios.get('http://localhost:5000/godtoolshost/api/app/fetchtokens');
        console.log(response.data)
        setAvailableTokens(response.data.tokens);
        setCurrentToken(response.data.tokens[0]); 
    } catch (error) {
        console.error('Error fetching available tokens:', error);
    }
    };

    // Fetch current token price from CoinGecko API
    const fetchTokenPrice = async (token) => {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`);
        setCurrentTokenPrice(response.data[token]);
    } catch (error) {
        console.error('Error fetching token price:', error);
    }
    };
          
    useEffect(() => {
        fetchAvailableTokens();
    }, []);

    useEffect(() => {
      fetchTokenPrice(currentToken);
    }, [currentToken]);
  
    const handleTokenChange = (token) => {
      setCurrentToken(token);
    };
  
    const [digitalSign, setDigitalSign] = useState('');
    const handlePay = async () => {
      try {
        const totalPriceWithFee = totalPriceOrder * 1.05;

        const response = await axios.post(
          'http://localhost:5000/godtoolshost/api/app/cyperpay',
          {
            products: products,
            price: totalPriceOrder,
            price_fee: totalPriceWithFee,
            token: currentToken,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + auth.token,
            },
          }
        );
  
        setPaymentAddress(response.data.address);
        setToPay({
            price: response.data.price,
            token: response.data.token
        })
        setDigitalSign(response.data.qrCode);

        if (response.data.address) {
            toast.success(`Pay to address: ${response.data.address}`, {position: toast.POSITION.BOTTOM_CENTER})

            clearCart()
            fetchProducts()
        }

      } catch (error) {
        console.error('Error creating payment order:', error);
      }
    };
  
    const copyLinkToClipboard = (value) => {
        navigator.clipboard
          .writeText(value)
          .then(() => {
            toast.success('Copied to clipboard', {
              position: toast.POSITION.BOTTOM_CENTER,
            });
          })
          .catch((error) => {
            console.error('Failed to copy to clipboard:', error);
          });
    };

    const handlePayBalance = async () => {
        try {
            const response = await axios.post(
              'http://localhost:5000/godtoolshost/api/app/balancepay',
              {
                price: totalPriceOrder,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + auth.token,
                },
              }
            );
      
    
            if(response.data.message === 'global_success'){
                setPaymentStatus(true)
                finishOrderProcess()
            }
    
          } catch (error) {
            console.error('Error paying order with balance:', error);
          }
    }

    const calculateDiscountedPrice = (item) => {
      const quantity = parseInt(item.quantity);
      const { borders } = item.product_info;
      let percentageDiscount = 0;
    
      if (Array.isArray(borders)) {
        for (const border of borders) {
          if (quantity >= border.start && quantity <= border.end) {
            percentageDiscount = border.percentage;
            break;
          }
        }
      }
    
      const discountedPrice = item.product_info.price - (item.product_info.price * percentageDiscount) / 100;
    
      return percentageDiscount !== 0 ? discountedPrice : item.product_info.price;
    };
    

    return (
        <>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Finish Order</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            {/* <PayPalButton
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [{
                        amount: {
                          currency_code: "USD",
                          value: totalPriceOrder
                        }
                      }],
                      application_context: {
                        shipping_preference: "NO_SHIPPING" 
                      }
                    });
                  }}
                  onApprove={(data, actions) => {
                    
                    return actions.order.capture().then(function(details) {
                        toast.success('Payment success!', {position: toast.POSITION.BOTTOM_CENTER})
                        setPaymentStatus(true);
                        finishOrderProcess()
                    });

                  }}
                  catchError={(err) => {
                    toast.error('Payment failed!', {position: toast.POSITION.BOTTOM_CENTER})
                    setPaymentStatus(false);
                  }}
                  onError={(err) => {
                    toast.error('Payment failed!', {position: toast.POSITION.BOTTOM_CENTER})
                    setPaymentStatus(false);
                  }}
                  /> 

                  <hr /> */}

                <div>
                <Button variant="dark" className="w-100 mt-4" onClick={handlePayBalance}>
                    Pay with account balance
                </Button>

                <hr />

                <center>
                    {digitalSign && (
                        <QRCode value={digitalSign} />
                    )}
                    
                </center>
                <div className='text-center'>
                    <ButtonGroup className="mt-4">
                    {availableTokens.map((token) => (
                        <Button
                        key={token}
                        variant={currentToken === token ? 'warning' : 'outline-warning'}
                        onClick={() => handleTokenChange(token)}
                        defaultValue={currentToken}
                        >
                        {token}
                        </Button>
                    ))}
                    </ButtonGroup>
                </div>
                {!paymentAddress && (
                    <Button variant="dark" className="w-100 mt-4" onClick={handlePay}>
                    Pay with {currentToken}
                    </Button>
                )}
                {paymentAddress && (
                    <>
                    <p className='wallet-info' onClick={() => copyLinkToClipboard(`${paymentAddress}`)}>Send your payment to: <br /> <b>{paymentAddress}</b> &nbsp; <i className="fa-solid fa-copy fa-beat-fade"></i> </p>
                    <p className='wallet-info' onClick={() => copyLinkToClipboard(`${toPay.price}`)}>
                        {toPay && (
                            <>
                            Amount to send: <br /> <b>{toPay.price} </b> {toPay.token} &nbsp; <i className="fa-solid fa-copy fa-beat-fade"></i>
                            </>
                        )}
                    </p>

                    <h5 className="text-center m-2" style={{ color: 'white' }}>Transaction successfully created and currently awaiting payment. Once payment is completed, your order will appear in the orders section. Thank you for your business!</h5>
                    </>
                )}
                </div>

                  {/* <hr />

                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 172 33"><path fill="#fff" d="M151.26 16.64c-.89-.58-1.86-1-2.78-1.52-.6-.33-1.24-.63-1.76-1.06-.88-.72-.7-2.15.22-2.77 1.33-.88 3.52-.39 3.76 1.41 0 .04.04.07.08.07h2c.05 0 .09-.04.07-.1a3.94 3.94 0 00-1.46-2.94 4.66 4.66 0 00-2.84-.97c-5.28 0-5.77 5.59-2.92 7.35.33.2 3.12 1.6 4.1 2.21 1 .61 1.3 1.73.88 2.6-.4.81-1.4 1.37-2.42 1.3-1.1-.06-1.96-.66-2.26-1.59-.05-.17-.08-.5-.08-.63a.09.09 0 00-.08-.08h-2.17c-.03 0-.07.04-.07.08 0 1.56.39 2.43 1.45 3.22 1 .75 2.1 1.07 3.22 1.07 2.97 0 4.5-1.68 4.8-3.41.28-1.7-.22-3.23-1.74-4.24zm-94.2-7.59h-2.02a.09.09 0 00-.07.05l-1.78 5.86a.08.08 0 01-.16 0L51.25 9.1c-.01-.04-.04-.05-.08-.05h-3.31c-.04 0-.08.04-.08.07v14.96c0 .04.04.08.08.08h2.17c.04 0 .08-.04.08-.08V12.7c0-.09.13-.1.15-.02l1.8 5.9.13.4c0 .05.03.06.07.06h1.67c.04 0 .06-.03.07-.05l.13-.42 1.8-5.9c.02-.08.15-.06.15.03v11.37c0 .04.04.08.08.08h2.17c.04 0 .08-.04.08-.08V9.12c0-.03-.04-.07-.08-.07h-1.27zm60.98 0a.09.09 0 00-.08.05l-1.78 5.86a.08.08 0 01-.16 0l-1.78-5.86c0-.04-.03-.05-.07-.05h-3.3c-.04 0-.08.04-.08.07v14.96c0 .04.04.08.08.08h2.17c.03 0 .07-.04.07-.08V12.7c0-.09.13-.1.16-.02l1.8 5.9.12.4c.02.05.04.06.08.06h1.66a.1.1 0 00.08-.05l.13-.42 1.8-5.9c.02-.08.15-.06.15.03v11.37c0 .04.04.08.08.08h2.17c.04 0 .08-.04.08-.08V9.12c0-.03-.04-.07-.08-.07h-3.3zm-27.99 0H79.8c-.03 0-.07.04-.07.07V11c0 .04.04.08.07.08h3.97v13c0 .05.04.09.07.09h2.17c.04 0 .08-.04.08-.08V11.07h3.96c.04 0 .08-.04.08-.08V9.12c0-.03-.02-.07-.08-.07zm12.8 15.11h1.98c.05 0 .09-.06.07-.1l-4.08-15.01c0-.04-.03-.06-.07-.06H97.9a.09.09 0 00-.07.06l-4.08 15c-.02.05.02.1.07.1h1.98c.04 0 .06-.02.08-.05l1.18-4.36c.01-.04.04-.05.08-.05h4.36c.04 0 .07.02.08.05l1.18 4.36c.02.03.06.06.08.06zm-5.18-6.61l1.58-5.85a.08.08 0 01.16 0l1.58 5.85c.02.05-.02.1-.07.1h-3.17c-.06 0-.1-.05-.08-.1zm38.85 6.61h1.98c.05 0 .09-.06.08-.1L134.5 9.04c-.02-.04-.04-.06-.08-.06h-2.83a.09.09 0 00-.08.06l-4.08 15c-.01.05.03.1.08.1h1.97c.04 0 .07-.02.08-.05l1.18-4.36c.02-.04.04-.05.08-.05h4.37c.03 0 .06.02.07.05l1.19 4.36c0 .03.04.06.07.06zm-5.18-6.61l1.59-5.85a.08.08 0 01.15 0l1.59 5.85c0 .05-.03.1-.08.1h-3.17c-.05 0-.1-.05-.08-.1zm-64.12 4.39V17.3c0-.04.03-.08.07-.08h5.78c.04 0 .08-.04.08-.07v-1.87a.09.09 0 00-.08-.08H67.3c-.04 0-.07-.04-.07-.08v-3.96c0-.04.03-.08.07-.08h6.58c.04 0 .08-.04.08-.08V9.14a.09.09 0 00-.08-.08h-8.9a.09.09 0 00-.08.08v14.94c0 .04.04.08.08.08h9.17c.04 0 .08-.04.08-.08V22.1a.09.09 0 00-.08-.08h-6.86c-.04-.01-.06-.04-.06-.09zm103.86 2.09l-7.5-7.74a.08.08 0 010-.1l6.75-7a.07.07 0 00-.06-.13h-2.76c-.03 0-.04.01-.05.03l-5.73 5.93a.08.08 0 01-.13-.05V9.14a.09.09 0 00-.08-.08h-2.17a.09.09 0 00-.08.08v14.95c0 .04.04.08.08.08h2.17c.04 0 .08-.04.08-.08v-6.58c0-.07.09-.1.13-.05l6.5 6.68a.1.1 0 00.04.03h2.77c.05-.01.1-.1.04-.14z"></path><path fill="#E17726" stroke="#E17726" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M32.96 1l-13.14 9.72 2.45-5.73L32.96 1z"></path><path fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M2.66 1l13.02 9.8L13.35 5 2.66 1zm25.57 22.53l-3.5 5.34 7.49 2.06 2.14-7.28-6.13-.12zm-26.96.12l2.13 7.28 7.47-2.06-3.48-5.34-6.12.12z"></path><path fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M10.47 14.51l-2.08 3.14 7.4.34-.24-7.97-5.08 4.5zm14.68.01l-5.16-4.6-.17 8.07 7.4-.34-2.07-3.13zM10.87 28.87l4.49-2.16-3.86-3-.63 5.16zm9.4-2.17l4.46 2.17-.6-5.17-3.86 3z"></path><path fill="#D5BFB2" stroke="#D5BFB2" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M24.73 28.87l-4.46-2.16.36 2.9-.04 1.23 4.14-1.97zm-13.86 0l4.16 1.97-.03-1.23.36-2.9-4.49 2.16z"></path><path fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M15.1 21.78l-3.7-1.08 2.62-1.2 1.09 2.28zm5.41 0l1.1-2.29 2.63 1.2-3.73 1.1z"></path><path fill="#CC6228" stroke="#CC6228" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M10.87 28.87l.65-5.34-4.13.12 3.48 5.22zm13.23-5.34l.63 5.34 3.5-5.22-4.13-.12zm3.13-5.88l-7.4.34.68 3.8 1.1-2.3 2.63 1.2 2.99-3.04zM11.4 20.7l2.62-1.2 1.09 2.28.69-3.8-7.4-.33 3 3.05z"></path><path fill="#E27525" stroke="#E27525" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M8.4 17.65l3.1 6.05-.1-3-3-3.05zm15.84 3.05l-.12 3 3.1-6.05-2.98 3.05zm-8.44-2.71l-.7 3.8.88 4.48.2-5.91-.38-2.37zm4.02 0l-.36 2.36.18 5.92.87-4.49-.69-3.8z"></path><path fill="#F5841F" stroke="#F5841F" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M20.51 21.78l-.87 4.49.63.44 3.85-3 .12-3.01-3.73 1.08zM11.4 20.7l.1 3 3.86 3 .62-.43-.87-4.49-3.72-1.08z"></path><path fill="#C0AC9D" stroke="#C0AC9D" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M20.6 30.84l.03-1.23-.34-.28h-4.96l-.33.28.03 1.23-4.16-1.97 1.46 1.2 2.95 2.03h5.05l2.96-2.04 1.44-1.19-4.14 1.97z"></path><path fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M20.27 26.7l-.63-.43h-3.66l-.62.44-.36 2.9.33-.28h4.96l.34.28-.36-2.9z"></path><path fill="#763E1A" stroke="#763E1A" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M33.52 11.35L34.62 6l-1.66-5-12.7 9.4 4.89 4.11 6.9 2.01 1.52-1.77-.66-.48 1.05-.96-.8-.62 1.05-.8-.7-.54zM1 5.99l1.12 5.36-.72.53 1.07.8-.8.63 1.04.96-.66.48 1.52 1.77 6.9-2 4.89-4.13L2.66 1 1 5.99z"></path><path fill="#F5841F" stroke="#F5841F" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".25" d="M32.05 16.52l-6.9-2 2.08 3.13-3.1 6.05 4.1-.05h6.13l-2.31-7.13zm-21.58-2.01l-6.9 2.01-2.3 7.13H7.4l4.1.05-3.1-6.05 2.08-3.14zm9.35 3.48l.45-7.6 2-5.4h-8.92l2 5.4.45 7.6.17 2.38v5.9h3.67l.02-5.9.16-2.38z"></path></svg>

                  {!web3 ? (
                    <>
                    <Button variant="dark" className="w-100 mt-4" onClick={initializeWeb3}>Connect wallet</Button>
                    </>
                  ) : (
                    <>
                    <Button variant="warning" className="w-100 mt-4" disabled={payDisabled} onClick={handlePaymentWeb3}>Pay @ ETH</Button>
                    </>
                  )} */}
                  
            </Modal.Body>
            <Modal.Footer>

            </Modal.Footer>
        </Modal>

        <Modal show={showQuantity} onHide={handleCloseQuantity}>
            <Modal.Header closeButton>
            <Modal.Title>Edit quantity</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                    <Form onSubmit={updateItemQuantity}>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlInputEditQ">
                            <Form.Label>Quantity:</Form.Label>
                            <Form.Control type="number" min="1" max="100" defaultValue={itemQInfo?.quantity} onChange={(e) => setItemQInput(e.target.value)} />
                        </Form.Group>

                        <Button variant='success' type="submit" size="lg">UPDATE</Button>
                    </Form>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseQuantity}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>

        <div className="app-body-content">
            <h1><i className="fa-solid fa-cart-shopping"></i> Cart</h1>

            <center>{isLoading && <LoadingSpinner asOverlay />}</center>
            
            {!isLoading && products?.length < 1 ? (
                <>
                No results!
                </>
            ) : (
                <>
                <Table responsive className='custom-table-s'>
                <thead>
                        <tr>
                        <th width="100">#</th>
                        <th>Product Info</th>
                        <th>Order Info</th>
                        <th>Settings</th>
                        </tr>
                </thead>
                <tbody>
                {!isLoading && products && products.map((item, index) => {
                  const discountedPrice = calculateDiscountedPrice(item);

                  totalPriceOrder += discountedPrice * parseInt(item.quantity);
                  totalPriceWithoutDiscount += item.product_info.price * parseInt(item.quantity);

                  return (
                        <React.Fragment key={`item` + index}>
                        <tr>
                            <td className='text-center position-relative'>
                            <img
                                src={`http://localhost:5000/godtoolshost/${item.product_info.image}`}
                                alt={item.product_info.name}
                                className="img-fluid"
                                style={{ maxHeight: '60px' }}
                            />                   
                            </td>
                            <td className='table-info-custom'>
                                <span>Name:</span> {item.product_info.name} <br />
                                <span>Service:</span> {item.product_info.service_info} <br />
                                <span>Price:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.product_info.price)}
                            </td>
                            <td className='table-info-custom'>
                                <span>Quantity:</span> {item.quantity} <Button variant="warning" size="sm" className="btn-sm-customclass" onClick={() => handleShowQuantity(item.id)}><i className="fa-solid fa-pen-to-square"></i></Button> <br />
                                <span>Total price:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.product_info.price * parseInt(item.quantity))} <br />
                                <span>Total discounted price:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(discountedPrice * parseInt(item.quantity))}
                            </td>
                            <td>
                                <Button variant="danger" onClick={() => {
                                    deleteFromCart(item.id)
                                    fetchProducts()
                                }}> <i className="fa-solid fa-trash"></i> </Button>  
                            </td>
                        </tr>
                        </React.Fragment>
                    )
                })}
                </tbody>
                </Table>

                <div className="totalprice-order">
                    <h1>Total Price: <b>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPriceWithoutDiscount)}</b></h1>
                    <h1>Total Discounted Price: <b>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPriceOrder)}</b></h1>
                </div>

                <center>
                    <Button variant="danger" size="lg" className="m-2" onClick={() => {
                        clearCart()
                        fetchProducts()
                    }}> CLEAR CART </Button>
                    <Button variant="success" size="lg" className="m-2" onClick={handleShow}> FINISH ORDER </Button>
                </center>
                </>
            )}
        </div>
        </>
    )
}

export default Cart;