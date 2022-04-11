import { BaseKeyring, StoredKeyring } from "@keystonehq/base-eth-keyring";
import { KeystoneInteractionProvider } from "./KeystoneInteractionProvider";
import { TypedTransaction } from "@ethereumjs/tx";

export class KeystoneKeyring extends BaseKeyring {
  constructor(opts?: StoredKeyring) {
    super(opts);
  }

  getInteraction = (): KeystoneInteractionProvider => {
    return new KeystoneInteractionProvider();
  };

  signTransaction(address: string, tx: any): Promise<any> {
    return super.signTransaction(address, tx);
  }

  submitSignature = this.getInteraction().submitSignature;
}
