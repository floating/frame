/// <reference path="./rpc.d.ts" />
/// <reference path="./ethProvider.d.ts" />

type Callback<T> = (err: Error | null, result?: T) => void
