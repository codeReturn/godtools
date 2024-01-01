import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../shared/context/auth-context';

import { useHttpClient } from '../shared/hooks/http-hook';
import { useShopHook } from '../shared/hooks/shop-hook';

import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import { Row, Col, Button, Table, ButtonGroup, Form } from 'react-bootstrap';

import QRCode from 'react-qr-code';
import axios from 'axios';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const Deposits = () => {
    const auth = useContext(AuthContext);

    const userData = localStorage.getItem('userData')
    const parseData = JSON.parse(userData)

    const [isLoading, setIsLoading] = useState(false)

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

    const [pendingDeposits, setPendingDeposits] = useState();
    const [recentDeposits, setRecentDeposits] = useState();

    const getDepositList = async (status) => {
        try {
            setIsLoading(true)
            const response = await axios.post(
                'http://localhost:5000/godtoolshost/api/app/getdepositlist',
                {
                  status: status,
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + auth.token,
                  },
                }
            );

            if(response.data.deposits){
                if(status === false) {
                    setPendingDeposits(response.data.deposits)
                } else {
                    setRecentDeposits(response.data.deposits)
                }

                console.log(response.data.deposits)
            }
            setIsLoading(false)
        } catch (err) {
            console.log(err)
            setIsLoading(false)
        }
    }
  
    const [totalPriceOrder, setTotalPriceOrder] = useState()
    const [digitalSign, setDigitalSign] = useState('');
    const handlePay = async () => {
        const totalPriceWithFee = totalPriceOrder * 1.05;
        
        try {
        setIsLoading(true)
        const response = await axios.post(
          'http://localhost:5000/godtoolshost/api/app/createdeposit',
          {
            pricenofee: totalPriceOrder,
            price: totalPriceWithFee,
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

            getDepositList(false)
            getDepositList(true)
        }
        setIsLoading(false)

      } catch (error) {
        console.error('Error creating payment order:', error);
        setIsLoading(false)
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

    useEffect(() => {
        getDepositList(false)
        getDepositList(true)
    }, []);

    const [balanceEmail, setBalanceEmail] = useState();
    const [balanceAmount, setBalanceAmount] = useState()

    const sendBalance = async (event) => {
        event.preventDefault();

        try {
            setIsLoading(true)
            const response = await axios.post(
              'http://localhost:5000/godtoolshost/api/app/sendbalance',
              {
                email: balanceEmail,
                amount: balanceAmount,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + auth.token,
                },
              }
            );
      
    
            if (response.data.message === 'global_success') {
                toast.success(`Balance sended to: ${balanceEmail}`, {position: toast.POSITION.BOTTOM_CENTER})
    
                setBalanceEmail('')
                setBalanceAmount('')
            }
            setIsLoading(false)
    
          } catch (error) {
            console.error('Error creating payment order:', error);
            toast.error(error.response.data.message, {position: toast.POSITION.BOTTOM_CENTER})
            setIsLoading(false)
          }
    }

    return (
        <>
        {isLoading && <LoadingSpinner asOverlay />}

        <div className="app-body-content">
            <h1><i className="fa-solid fa-money-bill-transfer"></i> Deposits</h1>

            <Row>
                <Col sm={7}>
                    <div className="deposit-form">
                        <div>
                        <center className="mb-4">
                            {digitalSign && (
                                <QRCode value={digitalSign} />
                            )}
                            
                        </center>
                        <form className="d-flex align-items-center justify-content-between">
                        <div className="flex-grow-1 position-relative" style={{ marginRight: "1rem"}}>
                            <span className="dolar-sign">$</span>
                            <input
                            style={{ padding: "7px" }}
                            type="number"
                            className="form-control"
                            onChange={(e) => setTotalPriceOrder(e.target.value)}
                            />
                        </div>

                        <ButtonGroup>
                            {availableTokens.map((token) => (
                            <Button
                                key={token}
                                variant={currentToken === token ? 'warning' : 'outline-warning'}
                                onClick={() => handleTokenChange(token)}
                            >
                                {token}
                            </Button>
                            ))}
                        </ButtonGroup>
                        </form>
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

                            <h5 className="text-center m-2" style={{ color: 'white' }}>Transaction successfully created and currently awaiting payment. Once payment is completed, your balance will be updated. Thank you for your business!</h5>
                            </>
                        )}
                        </div>
                    </div>

                    <div className="deposits-list">
                        <h2>Pending Deposits</h2>

                        <Table responsive striped hover variant="dark">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Price</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Address</th>
                                <th>Amount</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!isLoading && pendingDeposits && pendingDeposits.length < 1 ? (
                                <>
                                <tr>
                                    <td>No results!</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                                </>
                            ) : (
                                <>
                                {pendingDeposits && pendingDeposits.length > 0 && pendingDeposits.map((pending, index) => {
                                    const dateFromBackend = new Date(pending.date); 

                                    const formattedDate = dateFromBackend.toLocaleString();
                                    
                                    return (
                                        <React.Fragment key={`pending` + index}>
                                            <tr>
                                                <td>{index + 1}.</td>
                                                <td>{pending.price} $</td>
                                                <td>{pending.crypto_info.token}</td>
                                                <td>{pending.status === false ? (
                                                    <>
                                                    <span style={{ color: 'yellow'}}>Pending</span>
                                                    </>
                                                ) : (
                                                    <>
                                                    <span style={{ color: 'green'}}>Paid</span>
                                                    </>
                                                )}</td>
                                                <td>{pending.address}</td>
                                                <td>{pending.crypto_info.amount} {pending.crypto_info.token}</td>
                                                <td>{formattedDate}</td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                })}
                                </>
                            )}
                        </tbody>
                        </Table>
                    </div>
                </Col>
                <Col sm={5}>
                <div className="send-balance">
                        <h2>Send Balance</h2>

                        <div className="balance-form">
                        <Form onSubmit={sendBalance}>
                            <Form.Group className="mb-3" controlId="exampleForm.ControlInputEmail">
                                <Form.Label>Email address</Form.Label>
                                <Form.Control type="email" value={balanceEmail} onChange={(e) => setBalanceEmail(e.target.value)} placeholder="name@example.com" />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="exampleForm.ControlInputAmount">
                                <Form.Label>Amount</Form.Label>
                                <Form.Control type="number" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} min="0" />
                            </Form.Group>

                            <Button variant='warning' type='submit' className='w-100'>SEND</Button>
                        </Form>
                        </div>
                </div>
                <div className="deposits-list">
                        <h2>Recent Deposits</h2>

                        <Table responsive striped hover variant="dark">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Payment method</th>
                                <th>Date of deposit</th>
                                <th>Dollar Amounts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!isLoading && recentDeposits && recentDeposits.length < 1 ? (
                                <>
                                <tr>
                                    <td>No results!</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                                </>
                            ) : (
                                <>
                                    {recentDeposits && recentDeposits.length > 0 && recentDeposits.map((recent, index) => {
                                    const dateFromBackend = new Date(recent.deposit_date); 

                                    const formattedDate = dateFromBackend.toLocaleString();
                                    
                                    return (
                                        <React.Fragment key={`pending` + index}>
                                            <tr>
                                                <td>{index + 1}.</td>
                                                <td>{recent.crypto_info.token}</td>
                                                <td>{formattedDate}</td>
                                                <td>{recent.price}</td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                })}
                                </>
                            )}
                        </tbody>
                        </Table>
                    </div>

                </Col>
            </Row>
        </div>
        </>
    )
}

export default Deposits;