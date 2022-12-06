import { BaseKeyring, StoredKeyring } from "@keystonehq/base-eth-keyring";
import { KeystoneInteractionProvider } from "./KeystoneInteractionProvider";
import { TypedTransaction } from "@ethereumjs/tx";
import log from "electron-log";

export class KeystoneKeyring extends BaseKeyring {
  constructor(opts?: StoredKeyring) {
    super(opts);
  }

  getInteraction = (): KeystoneInteractionProvider => {
    return new KeystoneInteractionProvider();
  };

  signTransaction(address: string, tx: any): Promise<any> {
    log.info('signTransaction', tx)
    return super.signTransaction(address, tx);
  }

  submitSignature = this.getInteraction().submitSignature;
}
