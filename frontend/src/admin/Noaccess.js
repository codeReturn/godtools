import React from 'react';

import noaccess from '../images/noaccess.png';

const Noaccess = () => {
    return (
        <center>
            <img src={noaccess} style={{ maxHeight: "500px" }} alt="no access" className="img-fluid" />
        </center>
    )
};

export default Noaccess;