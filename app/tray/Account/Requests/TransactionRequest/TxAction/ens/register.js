import React from 'react'
import Recipient from '../recipient'

const Register = ({ address, domain, copyAddress }) => (
  <Recipient address={address} ens={domain} copyAddress={copyAddress} textSize={22} />
)

export default Register
