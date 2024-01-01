import React, { useState, useEffect } from 'react';

import { useHttpClient } from '../shared/hooks/http-hook';

import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

import { Button, Modal, Table } from 'react-bootstrap';

const Status = () => {
    const { sendRequest, isLoading, error } = useHttpClient()
    const [articles, setArticles] = useState([])

    const fetchArticles = async () => {
        try {
            const responseData = await sendRequest(`http://localhost:5000/godtoolshost/api/app/getarticles`)

            setArticles(responseData.articles)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchArticles()
    }, []);

    const [articleInfo, setArticleInfo] = useState();
    const [show, setShow] = useState(false);
    const handleClose = () => {
        setShow(false);
        setArticleInfo('')
    }
    const handleShow = (id) => {
        setShow(true);
        const find = articles?.find((a) => a._id === id)
        setArticleInfo(find)
    }

    return (
        <>
        <Modal size='lg' show={show} onHide={handleClose}>
            <Modal.Header closeButton>
            <Modal.Title>Informations</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="article-info-modal">
                {articleInfo && (
                    <>
                    <div className="article-info-block"> 
                    <div className="customblock-info-price"> Status: <span>{articleInfo.active === true ? (<><span style={{ color: 'green' }}>working</span></>) : (<><span style={{ color: 'red' }}>not working</span></>)}</span> </div>

                    <div className="article-img">
                        <img src={`http://localhost:5000/godtoolshost/${articleInfo.image}`} className="img-fluid" />
                    </div>

                    <h1>{articleInfo.title}</h1>
                    <p>{articleInfo.description}</p>
                    </div>
                    </>
                )}
                </div>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>

        <div className="app-body-content"> 
            <h1>Status</h1>

            <center>
                {isLoading && <LoadingSpinner />}
            </center>

            <Table responsive className='custom-table-s'>
                <thead>
                    <tr>
                    <th>Product name</th>
                    <th>Description</th>
                    <th>Status</th>
                    {/* <th></th> */}
                    </tr>
                </thead>
                <tbody>
                {!isLoading && articles && articles.map((art, index) => {

                    let short_description = art.description?.length > 100 ? 
                                    art.description.substring(0, 100 - 3) + "..." : 
                                    art.description;

                    return (
                        <React.Fragment key={`art` + index}>
                            <tr>
                                <td className='table-info-custom'>{art.title}</td>
                                <td className='table-info-custom'>{short_description}</td>
                                <td className='table-info-custom'>{art.active === true ? (<><span style={{ color: 'green' }}>working</span></>) : (<><span style={{ color: 'red' }}>not working</span></>)}</td>
                                {/* <td><Button variant="warning" size="sm" className="w-100" onClick={() => handleShow(art._id)}><i className="fa-solid fa-eye"></i></Button></td> */}
                            </tr>
                        </React.Fragment>
                    )
                })}
                </tbody>
            </Table>
        </div>
        </>
    )
}

export default Status;