import React from 'react'

import svg from '../../../svg'

class Blob extends React.Component {
  render () {
    return (
      <div className='blobMorph'>
        {svg.blob(100)}
      </div>
    )
  }
}

export default Blob
