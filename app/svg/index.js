import React from 'react'
import octicons from 'octicons'

module.exports = {
  logo: size => {
    let svg = `
      <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 153.6 153.6">
        <defs>
          <style>
            .cls-1 {
              fill-rule: evenodd;
            }
          </style>
        </defs>
        <title>FrameLogo</title>
        <path class="cls-1" d="M1000,507.72V448a8.58,8.58,0,0,0-8.58-8.58h-59.7a2,2,0,0,1-1.43-.59l-6.5-6.5a2,2,0,0,0-1.43-.59h-59.7a8.58,8.58,0,0,0-8.58,8.58V500a2,2,0,0,0,.59,1.43l6.5,6.5a2,2,0,0,1,.59,1.43v59.7a8.58,8.58,0,0,0,8.58,8.58H930a2,2,0,0,1,1.43.59l6.5,6.5a2,2,0,0,0,1.43.59h59.7a8.58,8.58,0,0,0,8.58-8.58v-59.7a2,2,0,0,0-.59-1.43l-6.5-6.5A2,2,0,0,1,1000,507.72Zm-24.68,46.92H886.4a1.63,1.63,0,0,1-1.64-1.64V464.12a1.63,1.63,0,0,1,1.64-1.64h88.88a1.63,1.63,0,0,1,1.64,1.64V553A1.63,1.63,0,0,1,975.28,554.64Z" transform="translate(-854.04 -431.76)"/>
      </svg>
    `
    return <div style={{width: size + 'px', height: size + 'px'}} dangerouslySetInnerHTML={{__html: svg}} />
  },
  octicon: (name, settings) => {
    return <span dangerouslySetInnerHTML={{__html: octicons[name].toSVG(settings)}} />
  }

}
