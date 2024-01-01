import React, { useEffect, useState, useContext } from 'react';

import useSocket from '../../shared/util/socket';

import { AuthContext } from '../../shared/context/auth-context';

import { useHttpClient } from '../../shared/hooks/http-hook';

import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';

import { Row, Col, Form, Button, Tabs, Tab } from 'react-bootstrap';

import axios from 'axios';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const AdminWhisper = () => {
    const auth = useContext(AuthContext);
    const socket = useSocket();

    const userData = localStorage.getItem('userData')
    const parseData = JSON.parse(userData)

    const { sendRequest, isLoading, error } = useHttpClient()

    const [messages, setMessages] = useState([])
    
    const [startLoading, setStartLoading] = useState(true)

    useEffect(() => {
        listPendingMessages()

        socket?.on('updateMessages', function(data) {
            setMessages((prev) => [...prev, data])

            listPendingMessages()
        })

        socket?.on('newPending', async function() {
            await listPendingMessages()
        })
        return () => {
            socket?.off('updateMessages');
            socket?.off('newPending');
        };
    }, []);

    const [licenseId, setLicenseId] = useState()
    const [nick, setNick] = useState();
    const [message, setMessage] = useState();

    const sendChatWhisper = async (e) => {
        e.preventDefault()

        try {
            const responseData = await sendRequest(
                `http://localhost:5000/godtoolshost/api/app/whisper`,
                'POST',
                JSON.stringify({
                        key: licenseId,
                        sender: nick,
                        message: message
                }),
                {
                      'Content-Type': 'application/json',
                      Authorization: 'Bearer ' + auth.token
                })

            if(responseData) {
                setMessage('')

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

    return (
        <>
        <div className="app-body-content">
              <h1><i className="fa-solid fa-robot"></i> Whisper</h1>

              {startLoading && (
                <>
                <div className="whisper-loading">
                <i className="fa-solid fa-circle-notch fa-spin"></i> Please kindly await while the complete content loads for your convenience. <br /> Your patience is greatly appreciated.
                </div>
                </>
              )}

              {!startLoading && (
                <>
                <Tabs
                    defaultActiveKey="profile"
                    id="uncontrolled-tab-example"
                    className="mb-3"
                    >
                    <Tab eventKey="chat" title="Chat">
                        {messages && messages.map((message, index) => {
                            return (
                                <React.Fragment key={`m` + index}>
                                <Row>
                                    <Col>
                                        <div className="message-block">
                                            <span className="message-block-license">{message.key}</span>
                                            <b>{message.sender}</b> <span>{message.message}</span> <br />
                                            <small>{new Date(message.date).toLocaleString()}</small>
                                        </div>
                                    </Col>
                                </Row>
                                </React.Fragment>
                            )
                        })}
                    </Tab>
                    <Tab eventKey="pending" title="Pending">
                        {pendingMessages && pendingMessages.map((pending, index) => {
                            return (
                                <React.Fragment key={`p` + index}>
                                <Row>
                                    <Col>
                                        <div className="message-block op">
                                            <b>{pending.nick}</b> <span>{pending.message}</span>
                                        </div>
                                    </Col>
                                </Row>
                                </React.Fragment>
                            )
                        })}
                    </Tab>
                </Tabs>
                </>
              )}

              {!startLoading && (
                <>
                <Form onSubmit={sendChatWhisper} className="acp-whisper-form">
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                        <Form.Label>License</Form.Label>
                        <Form.Control type="text" value={licenseId} onChange={(e) => setLicenseId(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
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
        </div>
        </>
    )
}

export default AdminWhisper;