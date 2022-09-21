import React from 'react'
import Recipient from '../recipient'

const Register = ({ address, domain, copyAddress }) =>
  <Recipient address={address} ens={domain} copyAddress={copyAddress} textSize={24} />

export default Register
