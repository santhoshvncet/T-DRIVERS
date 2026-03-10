const applicationError = {
    JWT_TOKEN_EXPIRE_ERROR: 'Could not verify JWT: JWTExpired',
    JWT_ISSUED_AT_FUTURE: "Could not verify JWT: JWTIssuedAtFuture",
    OFFLINE_ERROR: "Failed to fetch",
    OFFLINE_ERROR_MESSAGE: 'Network unreachable. Check your connection.',
    FIREBASE_NETWORK_ERROR: 'auth/network-request-failed'
}

export default applicationError