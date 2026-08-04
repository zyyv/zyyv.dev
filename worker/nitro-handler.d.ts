interface NitroWorkerHandler {
  fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response>
}

declare const nitro: NitroWorkerHandler

export default nitro
