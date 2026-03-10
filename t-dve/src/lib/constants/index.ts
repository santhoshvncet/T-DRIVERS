
import routes from './routes'
import common from './common'
import analytics from './analytics'
import applicationError from './applicationError'
import urls from './urls'
import user from './user'
import contextKeys from './contextKeys'
import { endPoints } from './endpoints'
import AllowedError from './AllowedError'


const constants = {
    ...routes,
    ...common,
    ...analytics,
    ...applicationError,
    ...urls,
    ...user,
    ...contextKeys,
    ...endPoints,
    ...AllowedError
}

export default constants