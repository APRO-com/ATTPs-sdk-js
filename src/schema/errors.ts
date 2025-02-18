type ErrorName =
  | 'PARAMETER_ERROR'
  | 'VRF_REQUEST_ERROR'

class ATTPsError extends Error {
  constructor(
    public name: ErrorName,
    public message: string,
    public cause?: Error,
  ) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export {
  ATTPsError,
}
