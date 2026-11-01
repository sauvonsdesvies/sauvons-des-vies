declare module "kkiapay-nodejs-sdk" {
  export default function kkiapay(configuration: {
    publickey: string;
    privatekey: string;
    secretkey: string;
    sandbox?: boolean;
  }): { verify(transactionId: string): Promise<unknown> };
}
