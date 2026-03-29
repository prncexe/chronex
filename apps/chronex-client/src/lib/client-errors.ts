export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (typeof error === 'string' && error.trim()) return error

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (error && typeof error === 'object') {
    const message = Reflect.get(error, 'message')
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallback
}
