import React, { useEffect, useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';

import Input from '../shared/components/FormElements/Input';
import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import { 
    VALIDATOR_REQUIRE,
    VALIDATOR_MINLENGTH 
} from '../shared/util/validators';

import { useForm } from '../shared/hooks/form-hook';
import { AuthContext } from '../shared/context/auth-context';

import { useHttpClient } from '../shared/hooks/http-hook';

import { Row, Col, Button, Form, Tabs, Tab } from 'react-bootstrap';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const Account = () => {
    const auth = useContext(AuthContext);
    const { isLoading, error, sendRequest, clearError } = useHttpClient();
    const [loadedUser, setLoadedUser] = useState();
    const history = useHistory();

    const [formState, inputHandler, setFormData] = useForm(
        {
          oldpassword: {
            value: '',
            isValid: false
          },
          newpassword: {
            value: '',
            isValid: false
          }
        },
        false
      );

      useEffect(() => {
        const fetchUser = async () => {
          try {
            const responseData = await sendRequest(
              `http://localhost:5000/godtoolshost/api/users/user/${auth.userId}`
            );
            console.log(responseData)
            setLoadedUser(responseData.user);
            setDiscord(responseData.user.discord);
            setTelegram(responseData.user.telegram);

            setFormData(
              {
                oldpassword: {
                  value: responseData.user.oldpassword,
                  isValid: true
                },
                newpassword: {
                    value: responseData.user.newpassword,
                    isValid: true
                }
              },
              true
            );
          } catch (err) {}
        };
        fetchUser();

        return () => {
            setLoadedUser()
        }
      }, [sendRequest, auth.userId, setFormData]);

      const userPasswordUpdateSubmitHandler = async event => {
        event.preventDefault();
        try {
          await sendRequest(
            `http://localhost:5000/godtoolshost/api/users/user/password/${auth.userId}`,
            'PATCH',
            JSON.stringify({
                oldpassword: formState.inputs.oldpassword.value,
                newpassword: formState.inputs.newpassword.value,
            }),
            {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + auth.token            
            }
          );

          toast.success('Password updated!', {position: toast.POSITION.BOTTOM_CENTER})
          history.push('/account');
        } catch (err) {
          toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    };

    const [discord, setDiscord] = useState()
    const [telegram, setTelegram] = useState()
    const updateSocials = async event => {
      event.preventDefault();
      try {
        await sendRequest(
          `http://localhost:5000/godtoolshost/api/users/user/socials/${auth.userId}`,
          'PATCH',
          JSON.stringify({
              discord: discord,
              telegram: telegram,
          }),
          {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + auth.token            
          }
        );

        toast.success('Socials updated!', {position: toast.POSITION.BOTTOM_CENTER})
        history.push('/account');
      } catch (err) {
        toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
      }
   };


    return (
        <>
        <div className="app-body-content">
        <h1><i className="fa-solid fa-user"></i> Account</h1>       

        <Row>
            <Col md="12">
            <center>{isLoading && <LoadingSpinner />}</center>

            {!isLoading && loadedUser && (
            <>
            <Tabs
              defaultActiveKey="edit-password"
              id="profile-tab"
              className="mb-3"
            >
              <Tab eventKey="edit-password" title="Edit password">
              <form onSubmit={userPasswordUpdateSubmitHandler}>
                <Form.Group className="mt-3 mb-3">
                <Input
                    id="oldpassword"
                    element="input"
                    type="password"
                    label={"Old password"}
                    validators={[VALIDATOR_REQUIRE(),VALIDATOR_MINLENGTH(6)]}
                    errorText={"This input is required and must have more than 6 characters"}
                    onInput={inputHandler}
                />
                </Form.Group>

                <Form.Group className="mt-3 mb-3">
                <Input
                    id="newpassword"
                    element="input"
                    type="password"
                    label={"New password"}
                    validators={[VALIDATOR_REQUIRE(),VALIDATOR_MINLENGTH(6)]}
                    errorText={"This input is required and must have more than 6 characters"}
                    onInput={inputHandler}
                />
                </Form.Group>

                <Button variant="warning" size="lg" type="submit" disabled={!formState.isValid}>
                    SAVE
                </Button>
                </form>
              </Tab>
              <Tab eventKey="profile" title="Edit socials">
                 <form onSubmit={updateSocials}>
                    <Form.Group className="mb-3" controlId="discordinp">
                      <Form.Label>Discord ID:</Form.Label>
                      <Form.Control type="text" defaultValue={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="Enter your discord id" />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="telegraminp">
                      <Form.Label>Telegram ID:</Form.Label>
                      <Form.Control type="text" defaultValue={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="Enter your telegram id" />
                    </Form.Group>

                    <Button variant="warning" size="lg" type="submit">
                    SAVE
                    </Button>
                 </form>
              </Tab>
            </Tabs>
            </>
            )}
            </Col>
        </Row>

        </div>
        </>
    )
}

export default Account;