import React, { useState, useEffect, useContext } from 'react';
import { useHistory, Link } from 'react-router-dom';

import Input from '../shared/components/FormElements/Input';
import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';
import {
  VALIDATOR_EMAIL,
  VALIDATOR_MINLENGTH,
  VALIDATOR_REQUIRE
} from '../shared/util/validators';
import { useForm } from '../shared/hooks/form-hook';
import { useHttpClient } from '../shared/hooks/http-hook';
import { AuthContext } from '../shared/context/auth-context';

import { Button, Row, Col, Form } from 'react-bootstrap';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});


const Auth = () => {
  const auth = useContext(AuthContext);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { isLoading, error, sendRequest } = useHttpClient();


  const [discord, setDiscord] = useState()
  const [telegram, setTelegram] = useState()
  const [affcode, setAffcode] = useState()

  const history = useHistory();

  const query = new URLSearchParams(window.location.search);
  const mode = query.get('mode')
  const acode = query.get('acode')

  useEffect(() => {
    mode === 'register' ? setIsLoginMode(false) : setIsLoginMode(true)
  }, [mode]);

  const [formState, inputHandler, setFormData, setResetHandler] = useForm(
    {
      email: {
        value: '',
        isValid: false
      },
      password: {
        value: '',
        isValid: false
      }
    },
    false
  );

  const switchModeHandler = () => {
    if (!isLoginMode) {
      setFormData(
        {
          ...formState.inputs,
          name: undefined,
        },
        formState.inputs.email.isValid && formState.inputs.password.isValid
      );
    } else {
      setFormData(
        {
          ...formState.inputs,
          name: {
            value: '',
            isValid: false
          }
        },
        false
      );
    }
    setIsLoginMode(prevMode => !prevMode);
  };

  const authSubmitHandler = async event => {
    event.preventDefault();

    if (isLoginMode) {
      try {
        const responseData = await sendRequest(
          'http://localhost:5000/godtoolshost/api/users/login',
          'POST',
          JSON.stringify({
            email: formState.inputs.email.value,
            password: formState.inputs.password.value
          }),
          {
            'Content-Type': 'application/json'
          }
        );

        toast.success('Success!', {position: toast.POSITION.BOTTOM_CENTER})
        auth.login(responseData.userId, responseData.token);
        history.push('/');
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
    } else {

      if (!discord && !telegram) {
        toast.error('One of these socials fields is mandatory during registration', {position: toast.POSITION.BOTTOM_CENTER})
        return;
      }
      

      try {
        const responseData = await sendRequest(
          'http://localhost:5000/godtoolshost/api/users/signup',
          'POST',
          JSON.stringify({
            name: formState.inputs.name.value,
            email: formState.inputs.email.value,
            password: formState.inputs.password.value,
            discord: discord,
            telegram: telegram,
            affcode: affcode
          }),
          {
            'Content-Type': 'application/json'
          }
        );

        toast.success('Success!', {position: toast.POSITION.BOTTOM_CENTER})
        auth.login(responseData.userId, responseData.token);
        history.push('/');
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
    }
  };

  return (
    <React.Fragment>
        {isLoading && <LoadingSpinner asOverlay />}
        {isLoginMode ? <><h3> Login </h3></> : <><h3> Create Account </h3></>}
        <form onSubmit={authSubmitHandler} className="main-form-style">
          {!isLoginMode && (
            <Input
              element="input"
              id="name"
              type="text"
              label="Name"
              validators={[VALIDATOR_REQUIRE()]}
              errorText="Please enter a name."
              onInput={inputHandler}
            />
          )}
          <Input
            element="input"
            id="email"
            type="email"
            label="Email"
            validators={[VALIDATOR_EMAIL()]}
            errorText="Please enter a valid email address."
            setResetHandler={setResetHandler}
            onInput={inputHandler}
          />
          <Input
            element="input"
            id="password"
            type="password"
            label="Password"
            validators={[VALIDATOR_MINLENGTH(6)]}
            setResetHandler={setResetHandler}
            errorText="Please enter a valid password, at least 6 characters."
            onInput={inputHandler}
          />

          {!isLoginMode && (
            <>
            <div>
              <Form.Group className="mb-3" controlId="exampleForm.ControlInputAffCode">
                <Form.Label>Affiliate Code </Form.Label>
                <Form.Control type="text" defaultValue={acode} onChange={(e) => setAffcode(e.target.value)} />
              </Form.Group>
            </div>

            <h1>Socials</h1>
            <Row>
              <Col sm={6}>
              <Form.Group className="mb-3" controlId="exampleForm.ControlInputDiscord">
                <Form.Label>Discord </Form.Label>
                <Form.Control type="text" onChange={(e) => setDiscord(e.target.value)} />
              </Form.Group>
              </Col>
              <Col sm={6}>
              <Form.Group className="mb-3" controlId="exampleForm.ControlInputTelegram">
                <Form.Label>Telegram</Form.Label>
                <Form.Control type="text" onChange={(e) => setTelegram(e.target.value)} />
              </Form.Group>
              </Col>
            </Row>
            </>
          )}

          <Button variant="warning" size="lg" type="submit">
            {isLoginMode ? 'LOGIN' : 'SIGNUP'}
          </Button>
        </form>

        <div className="form-footer">
          <div className="or-item"> OR </div>
          <hr />
        </div>

        <Button variant="dark" className="custom-dark-btn" size="lg" onClick={switchModeHandler}>
           {isLoginMode ? 'CREATE ACCOUNT' : 'LOGIN'}
        </Button>

        <Link to="/resetpassword">
        <Button variant="dark" className="custom-dark-btn" size="lg" style={{ marginLeft: "10px" }}>
           RESET PASSWORD
        </Button>
        </Link>
        
    </React.Fragment>
  );
};

export default Auth;
