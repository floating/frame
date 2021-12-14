/// <reference path="./rpc.d.ts" />

type Callback<T> = (err: Error | null, result?: T) => void
