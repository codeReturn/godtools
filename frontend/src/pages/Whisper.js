import React, { useEffect, useState, useContext, useRef } from 'react';

import useSocket from '../shared/util/socket';

import { AuthContext } from '../shared/context/auth-context';

import { useHttpClient } from '../shared/hooks/http-hook';

import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import { Row, Col, Form, Button, Table, InputGroup } from 'react-bootstrap';

import axios from 'axios';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const Whisper = () => {
    const auth = useContext(AuthContext);

    const userData = localStorage.getItem('userData')
    const parseData = JSON.parse(userData)

    const { sendRequest, isLoading, error } = useHttpClient()

    const [messages, setMessages] = useState([])
    
    const [startLoading, setStartLoading] = useState(true)

    const activeChat = useRef()
    const [notification, setNotification] = useState()

    const socket = useSocket();

    useEffect(() => {
        listPendingMessages()
    }, []);

    const [nick, setNick] = useState();
    const [message, setMessage] = useState();

    const sendChatWhisper = async (e) => {
        e.preventDefault()

        try {
            const responseData = await sendRequest(
                `http://localhost:5000/godtoolshost/api/app/sendchatwhisper`,
                'POST',
                JSON.stringify({
                        key: activeChat,
                        nick: nick,
                        message: message
                }),
                {
                      'Content-Type': 'application/json',
                      Authorization: 'Bearer ' + auth.token
                })

            if(responseData.message === 'global_success') {
                setNick('')
                setMessage('')

                toast.success('Your message has been sent, it is currently pending and will be displayed as soon as it is approved!', {position: toast.POSITION.BOTTOM_CENTER})

                await listPendingMessages()
            }
        } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    }

    const [pendingMessages, setPendingMessages] = useState([])
    const listPendingMessages = async () => {
        try {
            const responseData = await sendRequest(`http://localhost:5000/godtoolshost/api/app/getchatwhisper`)
            setPendingMessages(responseData)
        } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    }

    setTimeout(() => {
        setStartLoading(false)
    }, 5000);

    const fetchUser = async () => {
        try {
            const responseData = await axios.get(
                `http://localhost:5000/godtoolshost/api/users/user/${auth.userId}`
            )
            
            if(responseData?.data?.user?.licenses) {
                setActiveLicenses(responseData?.data?.user?.licenses)

                responseData?.data?.user?.licenses.map((l) => {
                    socket?.emit('join_license', l?.key)
                })
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchUser()
    }, [socket]);

    const [addLoading, setAddLoading] = useState(false)
    const [key, setKey] = useState()
    const [activeLicenses, setActiveLicenses] = useState([])
    const addWhisperLicense = async (e) => {
        e.preventDefault();

        try {
            setAddLoading(true)
            const responseData = await sendRequest(`http://localhost:5000/godtoolshost/api/app/getlicense/${key}`)
            if(responseData.license === null) {
                toast.error('License dont exist!', {position: toast.POSITION.BOTTOM_CENTER})
                setAddLoading(false)
                return;
            }

            if(responseData.license) {
                if(responseData.license.status === 1){
                    toast.error('License is expired!', {position: toast.POSITION.BOTTOM_CENTER})
                    setAddLoading(false)
                    return;
                }

                const addResponse = await addLicenseToUser(responseData.license)

                if(addResponse.message === 'global_success'){
                    setActiveLicenses((prev) => [...prev, responseData.license])
                    socket?.emit('join_license', key)
                    setKey('')    
                }
            }
            setAddLoading(false)
        } catch (err) {
            setAddLoading(false)
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    }

    const addLicenseToUser = async (license) => {
        try {
            const responseData = await sendRequest(
                `http://localhost:5000/godtoolshost/api/app/addlicensetouser`,
                'POST',
                JSON.stringify({
                    license: license,
                }),
                {
                      'Content-Type': 'application/json',
                      Authorization: 'Bearer ' + auth.token
                })

                return responseData;
        } catch (err){
            console.log(err)
        }
    }

    const [filteredMessages, setFilteredMessages] = useState([])
    const [activeLicenseInfo, setActiveLicenseInfo] = useState()
    const loadWhisperChat = (key) => {
        activeChat.current = key;
        const filter = messages?.filter((message) => message.key === key)
        const getkey = activeLicenses?.filter((license) => license.key === key)
        setActiveLicenseInfo(getkey[0])
        setFilteredMessages(filter)
    }

    useEffect(() => {
        socket?.on('updateMessages', function(data) {
            console.log(data)
            setNotification(data.key)
            setMessages((prev) => [...prev, data])
            listPendingMessages()

            if(activeChat.current === data.key){
                setFilteredMessages((prev) => [...prev, data])
            }
        })

        return () => {
            socket?.off('updateMessages');
        };
    }, [socket]);

    const deleteKey = async (key) => {
        try {
            await sendRequest(
            `http://localhost:5000/godtoolshost/api/app/deletelicensetouser/${key}`,
            'DELETE',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            }
            );
    
            toast.success('License deleted!', {position: toast.POSITION.BOTTOM_CENTER})
            fetchUser()
        } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    }
    
    return (
        <>
        <div id="app-test"></div>
        <div className="app-body-content">
              <h1><i className="fa-solid fa-robot"></i> Whisper</h1>

              {startLoading && (
                <>
                <div className="whisper-loading">
                <i className="fa-solid fa-circle-notch fa-spin"></i> Please kindly await while the complete content loads for your convenience. Your patience is greatly appreciated.
                </div>
                </>
              )}

              {!startLoading && (
                <>
                <div className="whisper-info">
                    <Row>
                        <Col sm={6}>
                        <h4>INFO:</h4>

                        <p>Whisper - A security feature for GTLauncher users.</p>
                        <p>Manage your in-game whispers through our website.</p>
                        <p>Whisper allows users to read and send messages in-game remotely.</p>
                        <p>Whisper feature is currently free of charge and comes with every purchase of GTLauncher.</p>

                        </Col>
                        <Col sm={6}>
                        <h4>HOW TO USE:</h4>
                        <p>Enter your license into license field below.</p>
                        <p>In-game type <b style={{ color: 'green'}}>/login  whisper licensekey</b></p>
                        <p>Simple as that. All GTLauncher / Bots now come prepacked with whisper feature.</p>
                        <p>Feedback / suggestions are much appreciated. Please start a discussion on our discord.</p>
                        </Col>
                    </Row>
                </div>

                {activeLicenses && activeLicenses.length > 0 && (
                    <>
                    <Table responsive className='custom-table-s' style={{ color: 'white'}}>
                    <thead>
                        <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Key</th>
                        <th>Status</th>
                        <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeLicenses.map((activel, index) => {
                            return (
                                <React.Fragment key={`activel` + index}>
                                <tr
                                className={`${activeChat === activel.key ? 'onhover-active' : 'onhover'} ${notification === activel.key ? 'notification-anime' : ''}`}
                                onClick={() => loadWhisperChat(activel.key)}
                                >
                                <td>{index + 1}</td>
                                <td>{activel.title}</td>
                                <td>{activel.key}</td>
                                <td>{activel.status === 0 ? <span style={{ color: 'green'}}>ACTIVE</span> : <span style={{ color: 'red'}}>EXPIRED</span>}</td>
                                <td><Button size='sm' variant='danger' onClick={() => deleteKey(activel.key)} style={{ padding:'0px 5px'}}><i className="fa-solid fa-trash"></i></Button></td>
                                </tr>
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                    </Table>
                    </>
                )}

                <Form onSubmit={addWhisperLicense}>
                <InputGroup className="mb-3">
                    <Form.Control
                    placeholder="License key"
                    aria-label="License key"
                    aria-describedby="basic-addonkey"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    />
                    <Button disabled={addLoading} variant="outline-warning" type="submit" id="basic-addonkey">
                    Connect
                    </Button>
                </InputGroup>
                </Form>

                {filteredMessages && filteredMessages.length < 1 && (
                    <>
                    <div className="no-messages-ico">
                        <i className="fa-solid fa-comment-slash"></i>
                    </div>
                    </>
                )}
                {filteredMessages && filteredMessages.length > 0 && filteredMessages.map((message, index) => {
                    console.log(message)
                            return (
                                <React.Fragment key={`m` + index}>
                                <Row>
                                    <Col>
                                        <div className="message-block">
                                            <span className="message-block-license">{activeLicenseInfo && activeLicenseInfo.title}</span>
                                            <b onClick={() => setNick(message.sender)}>{message.sender}</b> <span>{message.message}</span> <br />
                                            <small>{new Date(message.date).toLocaleString()}</small>
                                        </div>
                                    </Col>
                                </Row>
                                </React.Fragment>
                            )
                })}

                {activeChat.current && (
                    <>
                    <Form onSubmit={sendChatWhisper} className="acp-whisper-form">
                        <Form.Group className="my-3" controlId="exampleForm.ControlInput1">
                            <Form.Label>Nick</Form.Label>
                            <Form.Control type="text" value={nick} onChange={(e) => setNick(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                            <Form.Label>Message</Form.Label>
                            <Form.Control as="textarea" value={message} rows={3} onChange={(e) => setMessage(e.target.value)} />
                        </Form.Group>
                        <Button variant='warning' size='lg' type='submit'> SEND </Button>
                    </Form>
                    </>
                )}
                </>
              )}
        </div>
        </>
    )
}

export default Whisper;