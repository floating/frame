import React from 'react'
import octicons from 'octicons'

module.exports = {
  logo: size => {
    let svg = `
      <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 153.48 153">
        <defs>
          <style>
            .cls-1 {
              fill-rule: evenodd;
            }
          </style>
        </defs>
        <title>FrameLogo</title>
        <path class="cls-1" d="M999.67,507.59v-58a9.29,9.29,0,0,0-9.31-9.28H932.17a2.24,2.24,0,0,1-1.56-.64l-7-7A2.24,2.24,0,0,0,922,432H863.83a9.29,9.29,0,0,0-9.31,9.28v58a2.16,2.16,0,0,0,.65,1.55l7,7a2.16,2.16,0,0,1,.65,1.55v58a9.29,9.29,0,0,0,9.31,9.28h58.19a2.24,2.24,0,0,1,1.56.64l7,7a2.24,2.24,0,0,0,1.56.64h58.19a9.29,9.29,0,0,0,9.31-9.28v-58a2.16,2.16,0,0,0-.65-1.55l-7-7A2.16,2.16,0,0,1,999.67,507.59Zm-30,40.95H892.87a1.78,1.78,0,0,1-1.78-1.77V470.23a1.78,1.78,0,0,1,1.78-1.77h76.78a1.78,1.78,0,0,1,1.78,1.77v76.54A1.78,1.78,0,0,1,969.65,548.54Z" transform="translate(-854.52 -432)"/>
      </svg>

    `
    return <div style={{width: size + 'px', height: size + 'px'}} dangerouslySetInnerHTML={{__html: svg}} />
  },
  octicon: (name, settings) => {
    return <span dangerouslySetInnerHTML={{__html: octicons[name].toSVG(settings)}} />
  }

}
