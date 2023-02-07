import { getCID } from './cid'

export default {
  async verifyDapp(path: string, manifestCID: string) {
    const cid = await getCID(path, true)
    return cid?.toString() === manifestCID
  }
}
