import React from 'react';
import { Link } from 'react-router-dom';

import { Row, Col, Form, Button } from 'react-bootstrap';

import Input from '../shared/components/FormElements/Input';
import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';
import {
    VALIDATOR_EMAIL,
    VALIDATOR_REQUIRE
  } from '../shared/util/validators';
import { useForm } from '../shared/hooks/form-hook';
import { useHttpClient } from '../shared/hooks/http-hook';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const ResetPassword = () => {
    const { isLoading, error, sendRequest } = useHttpClient();

    const [formState, inputHandler, setFormData, setResetHandler, resetInputHandler] = useForm(
        {
          email: {
            value: '',
            isValid: false
          }  
        },
        false
    );
    
    const resetSubmit = async event => {
        event.preventDefault();
        try {
          const responseData = await sendRequest(
            'http://localhost:5000/godtoolshost/api/users/resetpassword',
            'POST',
            JSON.stringify({
              email: formState.inputs.email.value,
            }),
            {
              'Content-Type': 'application/json'
            }
          );

          if(responseData.message === 'sended'){
            resetInputHandler();
            toast.success('Email with reset link sended!', {position: toast.POSITION.BOTTOM_CENTER})
          }
        } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    };

    return (
        <>
        <div className="app-body-content">
            <h1> Reset Password </h1>
            <Row>
                <Col md="12">
                    {isLoading && <LoadingSpinner asOverlay />}

                    <Form onSubmit={resetSubmit}>
                    <Form.Group className="mb-3">
                        <Input
                            element="input"
                            name="email"
                            id="email"
                            type="email"
                            label="Email adress"
                            validators={[VALIDATOR_EMAIL(),VALIDATOR_REQUIRE()]}
                            errorText="This field is required!"
                            onInput={inputHandler}
                            setResetHandler={setResetHandler} 
                        />                    
                    </Form.Group>
                    <Button variant="warning" size="lg" type="submit" disabled={!formState.isValid}>SEND</Button>
                    </Form>

                    <hr />

                        <Link to='/auth?mode=login'><Button variant="dark" className="custom-dark-btn" size="lg"> LOGIN </Button></Link>
                        <Link to='/auth?mode=register'><Button variant="dark" className="custom-dark-btn" size="lg" style={{ marginLeft: "10px" }}> SIGN UP </Button></Link>
                </Col>
            </Row>

        </div>
        </>
    )   
}

export default ResetPassword;