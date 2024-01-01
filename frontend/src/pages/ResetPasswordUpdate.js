import React, { useEffect } from 'react';
import { useHistory } from "react-router-dom";

import { useParams } from 'react-router-dom';

import { Row, Col, Form, Button } from 'react-bootstrap';

import Input from '../shared/components/FormElements/Input';
import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';
import {
    VALIDATOR_MINLENGTH
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

const ResetPasswordUpdate = () => {
    const link = useParams().link;
    const { isLoading, error, sendRequest } = useHttpClient();

    let history = useHistory();

    const fetchInfo = async () => {
      try {
        const responseData = await sendRequest(
            `http://localhost:5000/godtoolshost/api/users/getlink/${link}`
        )

        if(responseData.message === "finished" || responseData.message === "noresult" || responseData.message === "expired"){
            history.push('/')
            toast.error(responseData.fullerror, {position: toast.POSITION.BOTTOM_CENTER})
        }
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }     
    }

    useEffect(() => {
      fetchInfo()
    }, [sendRequest]);


    const [formState, inputHandler, setFormData, setResetHandler, resetInputHandler] = useForm(
        {
          newpassword: {
            value: '',
            isValid: false
          },
          repeatpassword: {
            value: '',
            isValid: false
          }
        },
        false
    );
    
    const resetUpdateSubmit = async event => {
        event.preventDefault();
        try {
          const responseData = await sendRequest(
            'http://localhost:5000/godtoolshost/api/users/resetpasswordupdate',
            'POST',
            JSON.stringify({
                newpassword: formState.inputs.newpassword.value,
                repeatpassword: formState.inputs.repeatpassword.value,
                link: link
            }),
            {
              'Content-Type': 'application/json'
            }
          );

          if(responseData.message === 'updated'){
            resetInputHandler();
            toast.success('Profile password updated!', {position: toast.POSITION.BOTTOM_CENTER})
            history.push('/auth?mode=login')
          }
        } catch (err) {
          toast.info(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    };

    return (
        <>
        <div className="app-body-content">
            <h1> Update Password </h1>

            <Row>
                <Col md="12">
                    {isLoading && <LoadingSpinner asOverlay />}

                    <Form onSubmit={resetUpdateSubmit}>
                    <Form.Group className="mb-3">
                        <Input
                            element="input"
                            id="newpassword"
                            type="password"
                            label="New password"
                            validators={[VALIDATOR_MINLENGTH(6)]}
                            errorText="This field is required!"
                            onInput={inputHandler}
                            setResetHandler={setResetHandler} 
                        />                  
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Input
                            element="input"
                            id="repeatpassword"
                            type="password"
                            label="Repeat new password"
                            validators={[VALIDATOR_MINLENGTH(6)]}
                            errorText="This field is required!"
                            onInput={inputHandler}
                            setResetHandler={setResetHandler} 
                        />
                    </Form.Group>
                    <Button variant="dark" size="lg" type="submit" disabled={!formState.isValid}>UPDATE</Button>
                    </Form>
                </Col>
            </Row>
        </div>
        </>
    )   
}

export default ResetPasswordUpdate;