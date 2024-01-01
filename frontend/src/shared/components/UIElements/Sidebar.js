import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import useSocket from '../../util/socket';
import { Collapse, Nav, Button, Modal, Table } from 'react-bootstrap';

import { AuthContext } from '../../context/auth-context';

import {
	Drawer,
	DrawerOverflow,
	DrawerToC,
	DrawerToggle,
    DrawerNavigationHeader,
	DrawerNavigation
} from 'react-bootstrap-drawer';
import 'react-bootstrap-drawer/lib/style.css';

import axios from 'axios';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const Sidebar = (props) => {
    const auth = useContext(AuthContext)
    const socket = useSocket();
    const [open, setOpen] = useState(false);

	const handleToggle = () => setOpen(!open);
    
    const location = useLocation();

    const [path, setPath] = useState()
    useEffect(() => {
        setPath(location.pathname);
    }, [location]);

    const [userInfo, setUserInfo] = useState()
    const fetchUser = async () => {
        try {
            const responseData = await axios.get(
                `http://localhost:5000/godtoolshost/api/users/user/${auth.userId}`
            )

            setUserInfo(responseData?.data?.user)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        if(auth.userId) fetchUser()
    }, [auth.userId]);

    const [isLoading, setIsLoading] = useState(false)
    const [affiliates, setAffiliates] = useState([])
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = async () => {
        setShow(true)
    };

    const fetchAff = async () => {
        setIsLoading(true)

        try {
            const responseData = await axios.get(
                `http://localhost:5000/godtoolshost/api/app/getaffiliates/${auth.userId}`
            )

            setAffiliates(responseData.data.affiliates)
        } catch (err) {
            console.log(err)
        } finally {
            setIsLoading(false)
        }

    }

    useEffect(() => {
        if(auth.userId) fetchAff()
    }, [auth.userId]);

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

    const [notification, setNotification] = useState(false)

    useEffect(() => {
        socket && socket.on('newnotification', function() {
            console.log('called')
            setNotification(true);
        });        

        return () => {
            socket?.off('newnotification');
        }
    }, [socket]);

    useEffect(() => {
        console.log(notification)
    }, [notification]);
	return (
        <>
        {auth.token && affiliates && affiliates.length > 0 && (
        <Modal show={show} size="lg" onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Affiliate Statistics</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Table responsive striped hover variant="dark">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Title</th>
                                <th>Code</th>
                                <th>Balance</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {!isLoading && affiliates && affiliates.length < 1 ? (
                                <>
                                <tr>
                                    <td>No results!</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                                </>
                            ) : (
                                <>
                                {affiliates && affiliates.length > 0 && affiliates.map((aff, index) => {                                    
                                    return (
                                        <React.Fragment key={`pending` + index}>
                                            <tr>
                                                <td>{index + 1}.</td>
                                                <td>{aff.title} </td>
                                                <td>{aff.code}</td>
                                                <td>{aff.balance} $</td>
                                                <td>
                                                <Button variant='warning' size='sm' onClick={() => copyLinkToClipboard(`http://localhost:5000/auth?mode=register&acode=${aff.code}`)}> <i className="fa-solid fa-copy fa-beat-fade"></i> </Button>

                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                })}
                                </>
                            )}
                        </tbody>
                        </Table>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>
        )}

		<Drawer className={ props.className }>
			<DrawerToggle onClick={ handleToggle } />

			<Collapse in={ open }>
				<DrawerOverflow className='custom-drawer'>
					<DrawerToC>
                            <Link to={`/`}>
                            <DrawerNavigationHeader className="text-center">
                                <img src={`${process.env.PUBLIC_URL}/logo.png`} className="img-fluid" alt="godtools logo" style={{ maxHeight: "80px" }}/>
                            </DrawerNavigationHeader>
                            </Link>

                            {userInfo && (
                                <>
                                <hr />
                                
                                <center>
                                <small>Welcome back, <b>{userInfo?.name}</b></small> <br />
                                <small>Email: <b>{userInfo?.email}</b></small> <br />
                                <small>Account balance: <b style={{ color: 'green' }}>{userInfo?.balance} $</b></small>
                                </center>
                                </>
                            )}

                            <hr />

                            <DrawerNavigation>
                                <Nav.Item>
                                    <Link to="/store" className={path === "/" || path === "/store" ? 'nav_active' : ''}> <i className="fa-solid fa-store"></i> Store</Link>
                                </Nav.Item>

                                <Nav.Item>
                                    <Link to="/status" className={path === "/status" ? 'nav_active' : ''}> <i className="fa-solid fa-signal"></i> Status</Link>
                                </Nav.Item>

                                {auth.token && (
                                    <>
                                    <Nav.Item>
                                        <Link to="/deposits" className={path === "/deposits" ? 'nav_active' : ''}> <i className="fa-solid fa-money-bill-transfer"></i> Deposits</Link>
                                    </Nav.Item>

                                    <Nav.Item>
                                        <Link to="/account" className={path === "/account" ? 'nav_active' : ''}> <i className="fa-solid fa-user"></i> Account</Link>
                                    </Nav.Item>

                                    <Nav.Item>
                                        <Link to="/orders" className={path === "/orders" ? 'nav_active' : ''} onClick={() => setNotification(false)}> <i className="fa-solid fa-money-check-dollar"></i> Orders {notification && ( <><span className="order-notification">1</span></> )}</Link>
                                    </Nav.Item>              

                                    <Nav.Item>
                                        <Link to="/whisper" className={path === "/whisper" ? 'nav_active' : ''}> <i className="fa-solid fa-robot"></i> Whisper</Link>
                                    </Nav.Item>                           
                                    </>
                                )}
                            </DrawerNavigation>
					</DrawerToC>
				</DrawerOverflow>
			</Collapse>

            <div className="drawer-footer">
            {auth.token && affiliates && affiliates.length > 0 && (
                <Button variant="warning" onClick={handleShow}> Affiliate Statistics </Button>        
            )}
                    
            <a href="https://discord.gg/8pmjMqjAxp" target="_blank"> <Button variant="dark"> <i className="fa-brands fa-discord"></i> </Button> </a>
            <a href="https://t.me/+hyG2jauc8rNhN2M0" target="_blank"> <Button variant="dark"> <i className="fa-brands fa-telegram"></i> </Button> </a> 
            </div>
		</Drawer>
        </>
	);
};

export default Sidebar;