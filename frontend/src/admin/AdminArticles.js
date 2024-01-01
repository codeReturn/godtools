import React, { useState, useEffect, useContext } from 'react';

import Input from '../shared/components/FormElements/Input';
import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';
import ImageUpload from '../shared/components/FormElements/ImageUpload';
import {
  VALIDATOR_REQUIRE,
  VALIDATOR_MINLENGTH
} from '../shared/util/validators';
import { useForm } from '../shared/hooks/form-hook';
import { useHttpClient } from '../shared/hooks/http-hook';
import { AuthContext } from '../shared/context/auth-context';

import { Form, Button, Modal, Table, FloatingLabel } from 'react-bootstrap';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const AdminArticles = () => {
    const auth = useContext(AuthContext);
    const { isLoading, error, sendRequest } = useHttpClient();
    const [formState, inputHandler] = useForm(
      {
        title: {
          value: '',
          isValid: false
        },
        description: {
          value: '',
          isValid: false
        },
        image: {
          value: null,
          isValid: false
        },
      },
      false
    );
    
    const SubmitHandler = async event => {
      event.preventDefault();
      try {
        const formData = new FormData();
        formData.append('title', formState.inputs.title.value);
        formData.append('description', formState.inputs.description.value);
        formData.append('image', formState.inputs.image.value);
        await sendRequest('http://localhost:5000/godtoolshost/api/admin/createarticle', 'POST', formData, {
          Authorization: 'Bearer ' + auth.token
        });

        toast.success('Status added!', {position: toast.POSITION.BOTTOM_CENTER})
        handleClose()
        fetchArticles()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
    };

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => {
        setShow(true);
    }

    const [articles, setArticles] = useState([]);
    const fetchArticles = async () => {        
        try {
            const responseData = await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/getarticles`, 'GET',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            });
            
            setArticles(responseData.articles);
          } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
          }      
    };

    useEffect(() => {
        fetchArticles()
    }, []);


    // delete
    const deleteArticle = async (id) => {
      try {
        await sendRequest(
          `http://localhost:5000/godtoolshost/api/admin/deletearticle/${id}`,
          'DELETE',
          null,
          {
            Authorization: 'Bearer ' + auth.token
          }
        );

        toast.success('Status deleted!', {position: toast.POSITION.BOTTOM_CENTER})
        fetchArticles()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
    };

     // edit 
     const [showEdit, setShowEdit] = useState(false);

     const [editId, setEditId] = useState();
     const [editTitle, setEditTitle] = useState();
     const [editDescription, setEditDescription] = useState();
     const [editActive, setEditActive] = useState();
 
     const handleCloseEdit = () => {
       setShowEdit(false);
 
       setEditId('')
       setEditTitle('')
       setEditDescription('')
       setEditActive('')
     }
 
     const handleShowEdit = (id) => {
       const find = articles?.find((item) => item._id === id);
       
       setEditId(find._id)
       setEditTitle(find.title)
       setEditDescription(find.description)
       setEditActive(find.active)
 
       setShowEdit(true);
     }
 
     const saveArticle = async () => {
       try {
           await sendRequest(
               `http://localhost:5000/godtoolshost/api/admin/articles/${editId}`,
               'PATCH',
               JSON.stringify({
                   title: editTitle,
                   description: editDescription,
                   active: editActive
               }),
               {
                 'Content-Type': 'application/json',
                 Authorization: 'Bearer ' + auth.token
               }
             );
 
         toast.success('Status updated!', {position: toast.POSITION.BOTTOM_CENTER})
         handleCloseEdit()
         fetchArticles()
       } catch (err) {
         toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
       }    
    }

    return (
        <>
        <Modal show={showEdit} onHide={handleCloseEdit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit status</Modal.Title>
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

                <Form.Group className="mb-3" controlId="article-status">
                <Form.Check 
                  type="switch"
                  id="article-status"
                  className="form-check "
                  label="Article active"
                  onChange={(e) => setEditActive(e.target.checked)}
                  checked={editActive}
                />
                </Form.Group>

                <Button variant="success" onClick={() => saveArticle()}> Save </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEdit}>
            Close
          </Button>
        </Modal.Footer>
        </Modal>    

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Create Status</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                    {isLoading && <LoadingSpinner asOverlay />}
                    <Form onSubmit={SubmitHandler}>

                    <center>
                    <ImageUpload
                    id="image"
                    onInput={inputHandler}
                    errorText="Select image"
                    />
                    </center>

                    <Form.Group className="mb-3">
                    <Input
                    id="title"
                    element="input"
                    type="text"
                    label="Title"
                    validators={[VALIDATOR_REQUIRE()]}
                    errorText="This field is required!"
                    onInput={inputHandler}
                    />
                    </Form.Group>
                    <Input
                    id="description"
                    element="textarea"
                    label="Description"
                    onInput={inputHandler}
                    validators={[VALIDATOR_REQUIRE()]}
                    errorText="This field is required!"
                    />
                    <Form.Group className="mb-3">
                    </Form.Group>
                    <Button variant="dark" size="lg" type="submit" className="mt-4" disabled={!formState.isValid}>
                    CREATE STATUS
                    </Button>
                    </Form>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>


        <Button variant="warning" onClick={handleShow}>
        Create Status
        </Button>

        <h1 className='custom-h1-title'>Statuses</h1>

        <center>
        {isLoading && <LoadingSpinner />}

        {!isLoading && (
            <>
            <Table responsive className='custom-table-s'>
            <thead>
                <tr>
                <th width="100">#</th>
                <th>Info</th>
                <th>Settings</th>
                </tr>
            </thead>
            <tbody>
            {articles && articles.map((item, index) => {
                return (
                    <React.Fragment key={`service` + index}>
                    <tr>
                        <td className='text-center position-relative'>

                        <img
                            src={`http://localhost:5000/godtoolshost/${item.image}`}
                            alt={item.name}
                            className="img-fluid"
                            style={{ maxHeight: '60px' }}
                        />                   
                        </td>
                        <td className='table-info-custom'>
                            <span>Title:</span> {item.title} <br />
                            <span>Status:</span> {item.active === true ? (<><span style={{ color: 'green' }}>Active</span></>) : (<><span style={{ color: 'red' }}>Inactive</span></>)} <br />
                        </td>
                        <td>
                          <Button variant="warning" className='rounded-0' size="sm" onClick={() => handleShowEdit(item._id)}> <i className="fa-solid fa-pencil"></i> </Button>
                          <Button variant="danger" className='rounded-0' size="sm" onClick={() => deleteArticle(item._id)}> <i className="fa-solid fa-trash"></i> </Button>  
                        </td>
                    </tr>
                    </React.Fragment>
                )
            })}
            </tbody>
            </Table>
            </>
        )}
        </center>
        
        </>
    )
}

export default AdminArticles;