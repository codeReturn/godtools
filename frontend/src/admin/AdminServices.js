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

const AdminServices = () => {
    const auth = useContext(AuthContext);
    const { isLoading, error, sendRequest } = useHttpClient();
    const [formState, inputHandler] = useForm(
      {
        name: {
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
        }
      },
      false
    );
    
    const serviceSubmitHandler = async event => {
      event.preventDefault();
      try {
        const formData = new FormData();
        formData.append('name', formState.inputs.name.value);
        formData.append('description', formState.inputs.description.value);
        formData.append('image', formState.inputs.image.value);
        await sendRequest('http://localhost:5000/godtoolshost/api/admin/createservice', 'POST', formData, {
          Authorization: 'Bearer ' + auth.token
        });

        toast.success('Service added!', {position: toast.POSITION.BOTTOM_CENTER})
        handleClose()
        fetchServices()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
    };

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [services, setServices] = useState([]);
    const fetchServices = async () => {        
        try {
            const responseData = await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/getservices`, 'GET',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            });
            
            setServices(responseData.services);
          } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
          }      
    };

    useEffect(() => {
        fetchServices()
    }, []);

    // delete
    const deleteService = async (id) => {
      try {
        await sendRequest(
          `http://localhost:5000/godtoolshost/api/admin/deleteservice/${id}`,
          'DELETE',
          null,
          {
            Authorization: 'Bearer ' + auth.token
          }
        );

        toast.success('Service deleted!', {position: toast.POSITION.BOTTOM_CENTER})
        fetchServices()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
    };

    // edit 
    const [showEdit, setShowEdit] = useState(false);

    const [editId, setEditId] = useState();
    const [editName, setEditName] = useState();
    const [editDescription, setEditDescription] = useState();

    const handleCloseEdit = () => {
      setShowEdit(false);

      setEditId('')
      setEditName('')
      setEditDescription('')
    }

    const handleShowEdit = (id) => {
      const find = services?.find((item) => item._id === id);
      
      setEditId(find._id)
      setEditName(find.name)
      setEditDescription(find.description)

      setShowEdit(true);
    }

    const saveService = async () => {
      try {
          await sendRequest(
              `http://localhost:5000/godtoolshost/api/admin/services/${editId}`,
              'PATCH',
              JSON.stringify({
                  name: editName,
                  description: editDescription,
              }),
              {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + auth.token
              }
            );

        toast.success('Service updated!', {position: toast.POSITION.BOTTOM_CENTER})
        handleCloseEdit()
        fetchServices()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }    
    }

    return (
        <>
        <Modal show={showEdit} onHide={handleCloseEdit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
                <Form.Group className="mb-3" controlId="editName">
                  <Form.Label>Name:</Form.Label>
                  <Form.Control type="text" defaultValue={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter name" />
                </Form.Group>
                <FloatingLabel
                  controlId="editDescription"
                  label="Description"
                  className="mb-3"
                >
                  <Form.Control as="textarea" style={{ minHeight: '200px' }} onChange={(e) => setEditDescription(e.target.value)} defaultValue={editDescription} placeholder="Enter description" />
                </FloatingLabel>

                <Button variant="success" onClick={() => saveService()}> Save </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEdit}>
            Close
          </Button>
        </Modal.Footer>
        </Modal>    

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Create Category</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                    {isLoading && <LoadingSpinner asOverlay />}
                    <Form onSubmit={serviceSubmitHandler}>

                    <center>
                    <ImageUpload
                    id="image"
                    onInput={inputHandler}
                    errorText="Select image"
                    />
                    </center>

                    <Form.Group className="mb-3">
                    <Input
                    id="name"
                    element="input"
                    type="text"
                    label="Name"
                    validators={[VALIDATOR_REQUIRE()]}
                    errorText="This field is required!"
                    onInput={inputHandler}
                    />
                    </Form.Group>
                    <Input
                    id="description"
                    element="textarea"
                    label="Description"
                    validators={[VALIDATOR_MINLENGTH(5)]}
                    errorText="This field is required! (min 5 characters)"
                    onInput={inputHandler}
                    />
                    <Button variant="dark" size="lg" type="submit" className="mt-4" disabled={!formState.isValid}>
                    CREATE SERVICE
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
        Create Category
        </Button>

        <h1 className='custom-h1-title'>Categories</h1>

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
            {services && services.map((item, index) => {
                return (
                    <React.Fragment key={`service` + index}>
                    <tr>
                        <td className='text-center'>
                        <img
                            src={`http://localhost:5000/godtoolshost/${item.image}`}
                            alt={item.name}
                            className="img-fluid"
                            style={{ maxHeight: '60px' }}
                        />                   
                        </td>
                        <td className='table-info-custom'>
                            <span>Name:</span> {item.name} <br />
                            <span>Description:</span> {item.description} <br />
                            <span>Products:</span> {item.products.length}
                        </td>
                        <td> 
                          <Button variant="warning" className='rounded-0' size="sm" onClick={() => handleShowEdit(item._id)}> <i className="fa-solid fa-pencil"></i> </Button>
                          <Button variant="danger" className='rounded-0' size="sm" onClick={() => deleteService(item._id)}> <i className="fa-solid fa-trash"></i> </Button>  
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

export default AdminServices;