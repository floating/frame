import { hash } from 'eth-ens-namehash'

import store from '../../../store'
import nebulaApi from '../../../nebula'

const nebula = nebulaApi()

const resolve = {
  rootCid: async (app: string) => {
    const cid = store(`main.dapp.details.${hash(app)}.cid`)
    if (cid) return cid
    const resolved = await nebula.resolve(app)
    return resolved.record.content
  },
}

export default resolve
