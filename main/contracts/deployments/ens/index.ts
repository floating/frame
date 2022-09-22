import { BigNumber } from 'ethers'
import { Fragment, Interface } from 'ethers/lib/utils'

import { registrar as registrarAbi, registrarController as registrarControllerAbi } from './abi'
import { Contract } from '../../../reveal'

import type { JsonFragment } from '@ethersproject/abi'

namespace ENS {
  export type Register = {
    name: string
    owner: string
    duration: BigNumber // seconds
    resolver?: string
  }

  export type Renew = {
    name: string
    duration: BigNumber // seconds
  }

  export type Transfer = {
    from: string
    to: string
  }

  export type Approval = {
    to: string
  }
}

type DeploymentLocation = {
  name?: string
  address: Address
  chainId: number
}

function decode (abi: ReadonlyArray<Fragment | JsonFragment | string>, calldata: string) {
  const contractApi = new Interface(abi)
  return contractApi.parseTransaction({ data: calldata })
}

const registrar = ({ name = 'ENS Registrar', address, chainId }: DeploymentLocation): Contract => {
  return {
    name,
    chainId,
    address,
    decode: (calldata: string) => {
      const { name, args } = decode(registrarAbi, calldata)

      if (['transferfrom', 'safetransferfrom'].includes(name.toLowerCase())) {
        const { from, to } = args as unknown as ENS.Transfer

        return {
          id: 'ens:transfer',
          data: { name: 'jordan.eth', from, to }
        }
      }

      if (name === 'approve') {
        const { to } = args as unknown as ENS.Approval

        return {
          id: 'ens:approve',
          data: { name: 'jordan.eth', operator: to }
        }
      }
    }
  }
}

const registarController = ({ name = 'ENS Registrar Controller', address, chainId }: DeploymentLocation): Contract => {
  return {
    name,
    chainId,
    address,
    decode: (calldata: string) => {
      const { name, args } = decode(registrarControllerAbi, calldata)

      if (name === 'commit') {
        return {
          id: 'ens:commit'
        }
      }

      if (['register', 'registerwithconfig'].includes(name.toLowerCase())) {
        const { owner, name, duration, resolver } = args as unknown as ENS.Register

        return {
          id: 'ens:register',
          data: { address: owner, name, duration: duration.toNumber() }
        }
      }

      if (name === 'renew') {
        const { name, duration } = args as unknown as ENS.Renew

        return {
          id: 'ens:renew',
          data: { name, duration: duration.toNumber() }
        }
      }
    }
  }
}

const mainnetRegistar = registrar({
  name: '.eth Permanent Registrar',
  address: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
  chainId: 1
})

const mainnetRegistrarController = registarController({
  name: 'ETHRegistrarController',
  address: '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5',
  chainId: 1
})

export default [mainnetRegistar, mainnetRegistrarController]
