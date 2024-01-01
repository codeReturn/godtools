import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import { useHttpClient } from '../shared/hooks/http-hook';

import { Row, Col, Button } from 'react-bootstrap';
import LoadingSpinner from '../shared/components/UIElements/LoadingSpinner';

const Search = () => {
    const [loadedSearch, setLoadedSearch] = useState();
    const { isLoading, error, sendRequest } = useHttpClient();

    const search = useParams().search;

    const searchFetch = async () => {
        try {
            const responseData = await sendRequest(`http://localhost:5000/godtoolshost/api/app/search/${search}`)
            console.log(responseData)

            if(responseData.page === null){
                window.location.href = "/"
            } else {
                setLoadedSearch(responseData.results)
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        searchFetch()
    }, [search]);

    return (
        <>
            <div className="app-body-content">
              <h1><i className="fa-brands fa-searchengin searchicon"></i> Search</h1>

              <center>{isLoading && <LoadingSpinner />}</center>

              {!isLoading && loadedSearch && loadedSearch.length < 1 && (
                <>
                <p>No results for this search!</p>
                </>
              )}

              <Row className="mt-2">
              {!isLoading && loadedSearch && loadedSearch.map((s, index) => {
                return (
                    <React.Fragment key={`s` + index}>
                        <Col sm={3}>
                            <div className="customblock">
                            <div className="customblock-image">
                                <img src={`http://localhost:5000/godtoolshost/${s.image}`} className="img-fluid" />
                            </div>

                            <div className="customblock-info">
                                <h3>{s.name}</h3>
                                <div className="customblock-info-price"> Total products: <span>{s.products.length}</span> </div>
                            </div>

                            <Link to={`/service/${s._id}`}>
                            <Button variant="warning" className="w-100" size="lg"><i className="fa-solid fa-arrow-right"></i></Button>
                            </Link>
                            </div>
                        </Col>
                    </React.Fragment>
                )
              })}
              </Row>
            </div>
        </>
    )
}

export default Search;