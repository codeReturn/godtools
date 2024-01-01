import React, { useState, useEffect, useContext } from 'react';
import { useHistory, useLocation } from "react-router-dom";

import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';
import { useHttpClient } from '../shared/hooks/http-hook';
import { AuthContext } from '../shared/context/auth-context';

import { Form, Button, Modal, Table, FloatingLabel } from 'react-bootstrap';
import Paginate from '../shared/components/UIElements/Pagination';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const AdminAffiliates = () => {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const auth = useContext(AuthContext);
    const { isLoading, error, sendRequest, clearError } = useHttpClient();

    const [title, setTitle] = useState()
    const [description, setDescription] = useState();
    const [email, setEmail] = useState()
    
    const SubmitHandler = async event => {
      event.preventDefault();
      try {
        await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/createaffiliate`,
            'POST',
            JSON.stringify({
                title: title,
                description: description,
                email: email
            }),
            {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + auth.token
            }
        );

        toast.success('Affiliate added!', {position: toast.POSITION.BOTTOM_CENTER})
        handleClose()

        setTitle('')
        setDescription('')
        setEmail('')

        fetchAffiliates()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
    };

    const [loadedAffiliates, setLoadedAffiliates] = useState();
    const [totalArticles, setTotalArticles] = useState(0);
    const history = useHistory();
  
    const [page, setPage] = useState(1);

    const fetchAffiliates = async () => {        
        try {
            const responseData = await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/getaffiliates?page=1`, 'GET',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            });
            
            setLoadedAffiliates(responseData.pageOfItems);
            setTotalArticles(responseData.pager.totalItems);
            setPage(responseData.pager.currentPage);
        } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }      
    };

    const requestPage = async (page) => {
           history.push({
              pathname: "/admin/affiliates",
              search: `?page=${page}`,
            });

            try {
              const responseData = await sendRequest(
                  `http://localhost:5000/godtoolshost/api/admin/getaffiliates?page=${page}`,
                'GET',
                null,
                {
                    Authorization: 'Bearer ' + auth.token
                }
              );
            
              setLoadedAffiliates(responseData.pageOfItems);
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
        fetchAffiliates()
    }, []);

    // delete
    const deleteAffiliate = async (id) => {
        try {
            await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/deleteaffiliate/${id}`,
            'DELETE',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            }
            );
    
            toast.success('Affiliate deleted!', {position: toast.POSITION.BOTTOM_CENTER})
            fetchAffiliates()
        } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    };

    // edit 
    const [showEdit, setShowEdit] = useState(false);

    const [editId, setEditId] = useState();
    const [editTitle, setEditTitle] = useState();
    const [editDescription, setEditDescription] = useState();
    const [editEmail, setEditEmail] = useState();

    const handleCloseEdit = () => {
      setShowEdit(false);

      setEditId('')
      setEditTitle('')
      setEditDescription('')
      setEditEmail('')
    }

    const handleShowEdit = (id) => {
      const find = loadedAffiliates?.find((item) => item._id === id);
      
      setEditId(find._id)
      setEditTitle(find.title)
      setEditDescription(find.description)
      setEditEmail(find.email)

      setShowEdit(true);
    }

    const saveAffiliate = async () => {
      try {
          await sendRequest(
              `http://localhost:5000/godtoolshost/api/admin/affiliate/${editId}`,
              'PATCH',
              JSON.stringify({
                  title: editTitle,
                  description: editDescription,
                  email: editEmail
              }),
              {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + auth.token
              }
            );

        toast.success('Affiliate updated!', {position: toast.POSITION.BOTTOM_CENTER})
        handleCloseEdit()
        fetchAffiliates()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }    
   }

    return (
        <>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Create Affiliate</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                    {isLoading && <LoadingSpinner asOverlay />}
                    <Form onSubmit={SubmitHandler}>

                    <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                        id="description"
                        as="textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        />
                    </Form.Group>


                    <Button variant="dark" size="lg" type="submit" className="mt-4">
                    CREATE AFFILIATE
                    </Button>
                    </Form>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>

        <Modal show={showEdit} onHide={handleCloseEdit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Affiliate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
                <Form.Group className="mb-3" controlId="editTitle">
                  <Form.Label>Title:</Form.Label>
                  <Form.Control type="text" defaultValue={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Enter title" />
                </Form.Group>
                <FloatingLabel
                  controlId="editDescription"
                  label="Description"
                  className="mb-3"
                >
                  <Form.Control as="textarea" style={{ minHeight: '200px' }} onChange={(e) => setEditDescription(e.target.value)} defaultValue={editDescription} placeholder="Enter description" />
                </FloatingLabel>

                <Form.Group className="mb-3" controlId="editEmail">
                  <Form.Label>Email:</Form.Label>
                  <Form.Control type="email" defaultValue={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Enter email" />
                </Form.Group>

                <Button variant="success" onClick={() => saveAffiliate()}> Save </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEdit}>
            Close
          </Button>
        </Modal.Footer>
        </Modal>    


        <Button variant="warning" onClick={handleShow}>
            Create Affiliate
        </Button>

        <h1 className='custom-h1-title'><i className="fa-solid fa-handshake"></i> Affiliates</h1>

            <center>
                {isLoading && <LoadingSpinner />}
            </center>

            {!isLoading && (
                <>
                <Table responsive className='custom-table-s'>
                <thead>
                    <tr>
                    <th>Title</th>
                    <th>Code</th>
                    <th>Email</th>
                    <th>Balance</th>
                    <th></th>
                    </tr>
                </thead>
                <tbody>
                {loadedAffiliates && loadedAffiliates.map((affiliate, index) => {
                    return (
                        <React.Fragment key={`affiliate` + index}>
                        <tr>
                            <td className='table-info-custom'> 
                                {affiliate.title}
                            </td>
                            <td className='table-info-custom'>
                                {affiliate.code}
                            </td>
                            <td className='table-info-custom'>
                                {affiliate.email}
                            </td>
                            <td className='table-info-custom'>
                                {affiliate.balance} $
                            </td>
                            <td>
                                <Button variant="warning" className='rounded-0' size="sm" onClick={() => handleShowEdit(affiliate._id)}> <i className="fa-solid fa-pencil"></i> </Button>
                                <Button variant="danger" className='rounded-0' size="sm" onClick={() => deleteAffiliate(affiliate._id)}> <i className="fa-solid fa-trash"></i> </Button>  
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

export default AdminAffiliates;