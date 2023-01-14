/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./environment.d.ts" />
/// <reference path="./rpc.d.ts" />
/// <reference path="./restore.d.ts" />
/// <reference path="./state.d.ts" />
/// <reference path="./ethProvider.d.ts" />

type NullableTimeout = NodeJS.Timeout | null
type Callback<T> = (err: Error | null, result?: T) => void
