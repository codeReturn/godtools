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

import { Form, Button, Modal, Table, FloatingLabel, Row, Col } from 'react-bootstrap';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const AdminProducts = () => {
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
        },
        service: {
          value: null,
          isValid: false
        },
        price: {
          value: null,
          isValid: false
        }
      },
      false
    );
    
    const productSubmitHandler = async event => {
      event.preventDefault();
      try {
        const formData = new FormData();
        formData.append('name', formState.inputs.name.value);
        formData.append('description', formState.inputs.description.value);
        formData.append('image', formState.inputs.image.value);
        formData.append('service', formState.inputs.service.value);
        formData.append('price', formState.inputs.price.value);
        await sendRequest('http://localhost:5000/godtoolshost/api/admin/createproduct', 'POST', formData, {
          Authorization: 'Bearer ' + auth.token
        });

        toast.success('Product added!', {position: toast.POSITION.BOTTOM_CENTER})
        handleClose()
        fetchProducts()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
    };

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => {
        fetchServices()
        setShow(true);
    }

    const [products, setProducts] = useState([]);
    const fetchProducts = async () => {        
        try {
            const responseData = await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/getproducts`, 'GET',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            });
            
            setProducts(responseData.products);
          } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
          }      
    };

    useEffect(() => {
        fetchProducts()
    }, []);

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

    const onSelect = (e) => { 
        if(!e.target.value || e.target.value === ""){
            inputHandler('service', null, false);
        } else {
            inputHandler('service', e.target.value, true);
        }
    }

    // delete
    const deleteProduct = async (id) => {
      try {
        await sendRequest(
          `http://localhost:5000/godtoolshost/api/admin/deleteproduct/${id}`,
          'DELETE',
          null,
          {
            Authorization: 'Bearer ' + auth.token
          }
        );

        toast.success('Product deleted!', {position: toast.POSITION.BOTTOM_CENTER})
        fetchProducts()
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
    };

     // edit 
     const [showEdit, setShowEdit] = useState(false);

     const [editId, setEditId] = useState();
     const [editName, setEditName] = useState();
     const [editDescription, setEditDescription] = useState();
     const [editPrice, setEditPrice] = useState();
     const [editService, setEditService] = useState();
     const [editActive, setEditActive] = useState();

     const [editBorders, setEditBorders] = useState([])
     const [showFormBorders, setShowFormBorders] = useState(false)
 
     const handleCloseEdit = () => {
       setShowEdit(false);
 
       setEditId('')
       setEditName('')
       setEditDescription('')
       setEditPrice('')
       setEditService('')
       setEditActive('')
     }
 
     const handleShowEdit = (id) => {
       fetchServices()

       const find = products?.find((item) => item._id === id);
       
       const borders = find.borders ? find.borders : []
       console.log(borders)

       setEditId(find._id)
       setEditName(find.name)
       setEditDescription(find.description)
       setEditPrice(find.price)
       setEditService(find.service)
       setEditActive(find.active)
       setEditBorders(borders)
       setShowEdit(true);
     }
 
     const saveProduct = async () => {
       try {
           await sendRequest(
               `http://localhost:5000/godtoolshost/api/admin/products/${editId}`,
               'PATCH',
               JSON.stringify({
                   name: editName,
                   description: editDescription,
                   service: editService,
                   price: editPrice,
                   active: editActive,
                   borders: editBorders
               }),
               {
                 'Content-Type': 'application/json',
                 Authorization: 'Bearer ' + auth.token
               }
             );
 
         toast.success('Product updated!', {position: toast.POSITION.BOTTOM_CENTER})
         handleCloseEdit()
         fetchProducts()
       } catch (err) {
         toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
       }    
    }

    useEffect(() => {
      fetchServices()
    }, []);

    const [borderStart, setBorderStart] = useState()
    const [borderEnd, setBorderEnd] = useState();
    const [borderPercentage, setBorderPercentage] = useState()

    const addBorder = () => {
      if (!borderStart || !borderEnd || !borderPercentage) {
        toast.error('All fields are required!', { position: toast.POSITION.BOTTOM_CENTER });
        return;
      }
    
      const newStart = parseInt(borderStart);
      const newEnd = parseInt(borderEnd);
    
      const isOverlap = editBorders.some((border) => {
        const start = border.start;
        const end = border.end;
        return (newStart >= start && newStart <= end) || (newEnd >= start && newEnd <= end);
      });
    
      if (isOverlap) {
        toast.error('New border overlaps with an existing border!', { position: toast.POSITION.BOTTOM_CENTER });
        return;
      }
    
      const obj = {
        id: Math.random().toString(36).substr(2, 16),
        start: newStart,
        end: newEnd,
        percentage: parseInt(borderPercentage)
      };
    
      setEditBorders((prev) => [...prev, obj]);
    
      setBorderStart('');
      setBorderEnd('');
      setBorderPercentage('');
    };
    
    const deleteBorder = (id) => {
      const updatedBorders = editBorders.filter((border) => border.id !== id);
      setEditBorders(updatedBorders);
    };
  

    return (
        <>
        <Modal show={showEdit} size="lg" onHide={handleCloseEdit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
                <Form.Group className="mb-3" controlId="editName">
                  <Form.Label>Name:</Form.Label>
                  <Form.Control type="text" defaultValue={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter name" />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Service</Form.Label>
                        <Form.Select name="service" className="form-control" id="service" defaultValue={editService} aria-label="service-select" onChange={(e) => setEditService(e.target.value)}>
                        <option value=''>Select</option>
                        {services && services.map((s, index) => {
                
                            return (
                                <React.Fragment key={`select` + index}>
                                <option key={`serv` + index} value={s._id}>{s.name}</option>
                                </React.Fragment>
                            )
                        })}
                    </Form.Select>
                </Form.Group>
                <FloatingLabel
                  controlId="editDescription"
                  label="Description"
                  className="mb-3"
                >
                  <Form.Control as="textarea" style={{ minHeight: '200px' }} onChange={(e) => setEditDescription(e.target.value)} defaultValue={editDescription} placeholder="Enter description" />
                </FloatingLabel>
                <Form.Group className="mb-3" controlId="editPrice">
                  <Form.Label>Price:</Form.Label>
                  <Form.Control type="number" defaultValue={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="Enter price" />
                </Form.Group>

                <Form.Group className="mb-3" controlId="product-status">
                <Form.Check 
                  type="switch"
                  id="product-status"
                  className="form-check "
                  label="Product active"
                  onChange={(e) => setEditActive(e.target.checked)}
                  checked={editActive}
                />
                </Form.Group>

                <hr />
                    
                    {!showFormBorders ? (
                      <>
                      <Button variant="dark" className="float-end" onClick={() => setShowFormBorders(true)}><i className="fa-solid fa-plus"></i></Button>
                      </>
                    ) : (
                      <>
                      <Button variant="dark" className="float-end" onClick={() => setShowFormBorders(false)}><i className="fa-solid fa-minus"></i></Button>
                      </>
                    )}
                    <h3 style={{ color: '#FCD434' }}>Borders</h3> 
                    
                    {showFormBorders && (
                      <>
                      <Row className="align-items-center">
                        <Col xs={4}>
                          <Form.Label>Start Number</Form.Label>
                          <Form.Control value={borderStart} onChange={(e) => setBorderStart(e.target.value)} type="number" placeholder="Enter start number" />
                        </Col>
                        <Col xs={4}>
                          <Form.Label>End Number</Form.Label>
                          <Form.Control value={borderEnd} onChange={(e) => setBorderEnd(e.target.value)} type="number" placeholder="Enter end number" />
                        </Col>
                        <Col xs={4}>
                          <Form.Label>Percentage Number</Form.Label>
                          <Form.Control value={borderPercentage} onChange={(e) => setBorderPercentage(e.target.value)} type="number" placeholder="Enter percentage number" />
                        </Col>
                      </Row>

                      <Button variant="success" size="sm" className="my-4" onClick={() => addBorder()}> Add Border </Button>
                      </>
                    )}

                    <Table responsive striped hover variant="dark">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Percentage</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {editBorders && editBorders.length < 1 ? (
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
                                {editBorders && editBorders.length > 0 && editBorders.map((border, index) => {                                    
                                    return (
                                        <React.Fragment key={`border` + index}>
                                            <tr>
                                                <td>{index + 1}.</td>
                                                <td>{border.start}</td>
                                                <td>{border.end}</td>
                                                <td>{border.percentage} %</td>
                                                <td><Button variant="danger" size="sm" onClick={() => deleteBorder(border.id)}><i className="fa-solid fa-trash"></i></Button></td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                })}
                                </>
                            )}
                        </tbody>
                      </Table>
                <hr />

                <Button variant="success" onClick={() => saveProduct()}> Save </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEdit}>
            Close
          </Button>
        </Modal.Footer>
        </Modal>    

        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Create Product</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                    {isLoading && <LoadingSpinner asOverlay />}
                    <Form onSubmit={productSubmitHandler}>

                    <center>
                    <ImageUpload
                    id="image"
                    onInput={inputHandler}
                    errorText="Select image"
                    />
                    </center>

                    <Form.Group className="mb-3">
                    <Form.Label>Service</Form.Label>
                        <Form.Select name="service" className="form-control" id="service" aria-label="service-select" onChange={(e) => onSelect(e)}>
                        <option value=''>Select</option>
                        {services && services.map((s, index) => {
                            return (
                                <option key={`serv` + index} value={s._id}>{s.name}</option>
                            )
                        })}
                        </Form.Select>
                    </Form.Group>

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
                    <Form.Group className="mb-3">
                    <Input
                    id="price"
                    element="input"
                    type="number"
                    label="Price"
                    validators={[VALIDATOR_REQUIRE()]}
                    errorText="This field is required!"
                    onInput={inputHandler}
                    />
                    </Form.Group>
                    <Button variant="dark" size="lg" type="submit" className="mt-4" disabled={!formState.isValid}>
                    CREATE PRODUCT
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
        Create Product
        </Button>

        <h1 className='custom-h1-title'>Products</h1>

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
            {products && products.map((item, index) => {
                return (
                    <React.Fragment key={`service` + index}>
                    <tr>
                        <td className='text-center position-relative'>
                        {item.active === true ? (
                            <>
                                <div className='status-active'></div>
                            </>
                        ) : (
                            <>
                                <div className='status-inactive'></div>
                            </>
                        )}

                        <img
                            src={`http://localhost:5000/godtoolshost/${item.image}`}
                            alt={item.name}
                            className="img-fluid"
                            style={{ maxHeight: '60px' }}
                        />                   
                        </td>
                        <td className='table-info-custom'>
                            <span>Name:</span> {item.name} <br />
                            <span>Service:</span> {item.service_info} <br />
                            <span>Price:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}
                        </td>
                        <td>
                          <Button variant="warning" className='rounded-0' size="sm" onClick={() => handleShowEdit(item._id)}> <i className="fa-solid fa-pencil"></i> </Button>
                          <Button variant="danger" className='rounded-0' size="sm" onClick={() => deleteProduct(item._id)}> <i className="fa-solid fa-trash"></i> </Button>  
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

export default AdminProducts;