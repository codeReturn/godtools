import React, { useState, useEffect, useContext } from 'react';
import { useHistory, useLocation } from "react-router-dom";

import { AuthContext } from '../shared/context/auth-context';
import { useHttpClient } from '../shared/hooks/http-hook';

import { Table, Button, Dropdown } from 'react-bootstrap';

import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import Paginate from '../shared/components/UIElements/Pagination';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
toast.configure({
  draggable: false,
  pauseOnHover: false,
  pauseOnFocusLoss: false,
});

const AdminUsers = () => {
    const auth = useContext(AuthContext);
    const { sendRequest, isLoading, error, clearError } = useHttpClient();

    const [loadedUsers, setLoadedUsers] = useState();
    const [totalArticles, setTotalArticles] = useState(0);
    const history = useHistory();
  
    const [page, setPage] = useState(1);

    const fetchUsers = async () => {        
        try {
            const responseData = await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/getusers?page=1`, 'GET',
            null,
            {
                Authorization: 'Bearer ' + auth.token
            });
            
            setLoadedUsers(responseData.pageOfItems);
            setTotalArticles(responseData.pager.totalItems);
            setPage(responseData.pager.currentPage);
        } catch (err) {
            toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }      
    };

    const requestPage = async (page) => {
           history.push({
              pathname: "/admin/users",
              search: `?page=${page}`,
            });

            try {
              const responseData = await sendRequest(
                  `http://localhost:5000/godtoolshost/api/admin/getusers?page=${page}`,
                'GET',
                null,
                {
                    Authorization: 'Bearer ' + auth.token
                }
              );
            
              setLoadedUsers(responseData.pageOfItems);
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
        fetchUsers()
    }, []);

    // delete
    const deleteUser = async (id) => {
        try {
          await sendRequest(
            `http://localhost:5000/godtoolshost/api/admin/deleteuser/${id}`,
            'DELETE',
            null,
            {
              Authorization: 'Bearer ' + auth.token
            }
          );
  
          toast.success('User deleted!', {position: toast.POSITION.BOTTOM_CENTER})
          fetchUsers()
        } catch (err) {
          toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }
    };

    // rank
    const updateRank = async (id, type) => {
        try {
            await sendRequest(
                `http://localhost:5000/godtoolshost/api/admin/rank/${id}`,
                'PATCH',
                JSON.stringify({
                    type: type
                }),
                {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + auth.token
                }
              );
  
          toast.success('Rank updated!', {position: toast.POSITION.BOTTOM_CENTER})
          fetchUsers()
        } catch (err) {
          toast.error(error, {position: toast.POSITION.BOTTOM_CENTER})
        }    
    }

    return (
        <>
            <h1 className='custom-h1-title'><i className="fa-solid fa-users"></i> Users</h1>

            <center>
                {isLoading && <LoadingSpinner />}
            </center>

            {!isLoading && (
                <>
                <Table responsive className='custom-table-s'>
                <thead>
                    <tr>
                    <th>Info</th>
                    <th>Socials</th>
                    <th></th>
                    </tr>
                </thead>
                <tbody>
                {loadedUsers && loadedUsers.map((user, index) => {
                    return (
                        <React.Fragment key={`user` + index}>
                        <tr>
                            <td className='table-info-custom'> 
                                <span>Name:</span> {user.name} <br />
                                <span>Email:</span> {user.email} <br />
                                <span>Rank:</span> {user.rank === 1 ? (
                                    <>
                                    <span style={{ color: 'red'}}>Admin</span>
                                    </>
                                ) : user.rank === 2 ? (
                                    <>
                                    <span style={{ color: 'orange'}}>Moderator</span>
                                    </>
                                ) : 'User'}
                            </td>
                            <td className='table-info-custom'>
                                <span>Discord:</span> {user.discord ? user.discord : '-'} <br />
                                <span>Telegram:</span> {user.telegram ? user.telegram : '-'}
                            </td>
                            <td>

                                <Dropdown className="inline-bl">
                                <Dropdown.Toggle variant="dark" size="sm" className="acp-dd-btn" id="dropdown-basic">
                                    Rank
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    {user.rank === 0 ? (
                                    <>
                                        <Dropdown.Item href="#" onClick={() => updateRank(user._id, 2)}>set admin</Dropdown.Item>
                                        <Dropdown.Item href="#" onClick={() => updateRank(user._id, 3)}>set moderator</Dropdown.Item>
                                    </>
                                    ) : (
                                        <Dropdown.Item href="#" onClick={() => updateRank(user._id, 1)}>remove rank</Dropdown.Item>
                                    )}
                                </Dropdown.Menu>
                                </Dropdown>

                                <Button variant="danger" className='rounded-0' size="sm" onClick={() => deleteUser(user._id)}> <i className="fa-solid fa-trash"></i> </Button>  
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

export default AdminUsers;