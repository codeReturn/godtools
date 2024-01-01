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

const AdminLicenses = () => {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const auth = useContext(AuthContext);
    const { isLoading, error, sendRequest, clearError } = useHttpClient();

    const [title, setTitle] = useState()
    const [key, setKey] = useState();
    
    const SubmitHandler = async event => {
      event.preventDefault();
      try {
        await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/createlicense`,
            'POST',
            JSON.stringify({
                title: title,
                key: key,
            }),
            {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + auth.token
            }
        );

        toast.success('Lincence added!', {position: toast.POSITION.BOTTOM_CENTER})
        handleClose()

        setTitle('')
        setKey('')

        fetchLicenses()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
    };

    const [loadedLicenses, setLoadedLicenses] = useState();
    const [totalArticles, setTotalArticles] = useState(0);
    const history = useHistory();
  
    const [page, setPage] = useState(1);

    const fetchLicenses = async () => {        
        try {
            const responseData = await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/getlicenses?page=1`, 'GET',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            });
            
            setLoadedLicenses(responseData.pageOfItems);
            setTotalArticles(responseData.pager.totalItems);
            setPage(responseData.pager.currentPage);
        } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }      
    };

    const requestPage = async (page) => {
           history.push({
              pathname: "/admin/licenses",
              search: `?page=${page}`,
            });

            try {
              const responseData = await sendRequest(
                  `http://localhost:5000/godtoolshost/api/admin/getlicenses?page=${page}`,
                'GET',
                null,
                {
                    Authorization: 'Bearer ' + auth.token
                }
              );
            
              setLoadedLicenses(responseData.pageOfItems);
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
        fetchLicenses()
    }, []);

    // delete
    const deleteLicense = async (id) => {
        try {
            await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/deletelicense/${id}`,
            'DELETE',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            }
            );
    
            toast.success('License deleted!', {position: toast.POSITION.BOTTOM_CENTER})
            fetchLicenses()
        } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    };

    // edit 
    const [showEdit, setShowEdit] = useState(false);

    const [editId, setEditId] = useState();
    const [editTitle, setEditTitle] = useState();
    const [editKey, setEditKey] = useState();

    const handleCloseEdit = () => {
      setShowEdit(false);

      setEditId('')
      setEditTitle('')
      setEditKey('')
    }

    const handleShowEdit = (id) => {
      const find = loadedLicenses?.find((item) => item._id === id);
      
      setEditId(find._id)
      setEditTitle(find.title)
      setEditKey(find.key)

      setShowEdit(true);
    }

    const saveLicense = async () => {
      try {
          await sendRequest(
              `http://localhost:5000/godtoolshost/api/admin/license/${editId}`,
              'PATCH',
              JSON.stringify({
                  title: editTitle,
                  key: editKey,
              }),
              {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + auth.token
              }
            );

        toast.success('License updated!', {position: toast.POSITION.BOTTOM_CENTER})
        handleCloseEdit()
        fetchLicenses()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }    
   }

    return (
        <>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Create License</Modal.Title>
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
                        <Form.Label>Key</Form.Label>
                        <Form.Control
                        id="title"
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        required
                        />
                    </Form.Group>

                    <Button variant="dark" size="lg" type="submit" className="mt-4">
                    CREATE LICENSE
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
          <Modal.Title>Edit License</Modal.Title>
        </Modal.Header>
        <Modal.Body>
                <Form.Group className="mb-3" controlId="editTitle">
                  <Form.Label>Title:</Form.Label>
                  <Form.Control type="text" defaultValue={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Enter title" />
                </Form.Group>

                <Form.Group className="mb-3" controlId="editKey">
                  <Form.Label>Key:</Form.Label>
                  <Form.Control type="text" defaultValue={editKey} onChange={(e) => setEditKey(e.target.value)} placeholder="Enter key" />
                </Form.Group>

                <Button variant="success" onClick={() => saveLicense()}> Save </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEdit}>
            Close
          </Button>
        </Modal.Footer>
        </Modal>    


        <Button variant="warning" onClick={handleShow}>
            Create License
        </Button>

        <h1 className='custom-h1-title'><i className="fa-solid fa-key"></i> Licenses</h1>

            <center>
                {isLoading && <LoadingSpinner />}
            </center>

            {!isLoading && (
                <>
                <Table responsive className='custom-table-s'>
                <thead>
                    <tr>
                    <th>Title</th>
                    <th>Key</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th></th>
                    </tr>
                </thead>
                <tbody>
                {loadedLicenses && loadedLicenses.map((license, index) => {
                    return (
                        <React.Fragment key={`license` + index}>
                        <tr>
                            <td className='table-info-custom'> 
                                {license.title}
                            </td>
                            <td className='table-info-custom'>
                                {license.key}
                            </td>
                            <td className='table-info-custom'>
                                {new Date(license.date).toISOString().slice(0, 10)}
                            </td>
                            <td className='table-info-custom'>
                                {license.status === 0 ? (
                                    <span style={{ color: 'green' }}>ACTIVE</span>
                                ) : (
                                    <span style={{ color: 'red' }}>EXPIRED</span>
                                )}
                            </td>
                            <td>
                                <Button variant="warning" className='rounded-0' size="sm" onClick={() => handleShowEdit(license._id)}> <i className="fa-solid fa-pencil"></i> </Button>
                                <Button variant="danger" className='rounded-0' size="sm" onClick={() => deleteLicense(license._id)}> <i className="fa-solid fa-trash"></i> </Button>  
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

export default AdminLicenses;