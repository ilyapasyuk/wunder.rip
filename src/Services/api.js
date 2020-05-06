import Axios from 'axios'

class Api {
    constructor() {
        this.instance = Axios.create({
            baseURL: `/api`,
            validateStatus: status => {
                return status >= 200 && status < 300
            },
        })

        this.instance.interceptors.response.use(
            response => {
                return response.data
            },
            error => {
                const { status, data, headers } = error.response

                if (status === 400) {
                    return Promise.reject(data)
                }

                if (status === 401) {
                    let message = data && data.errors && data.errors[0]
                    if (!message) {
                        message = data
                    }

                    const errorObject = {
                        message,
                        code: 1,
                    }

                    return Promise.reject(new Error(errorObject.message))
                }

                if (status === 419) {
                    let message = data && data.errors && data.errors[0]
                    if (!message) {
                        message = data
                    }

                    const errorObject = {
                        message,
                        code: 1,
                    }

                    return Promise.reject(new Error(errorObject.message))
                }

                if (status === 403) {
                    const errorObject = {
                        message: data || 'Access Denied',
                        code: 1,
                    }

                    return Promise.reject(new Error(errorObject.message))
                }

                if (status === 500) {
                    const errorObject = {
                        message: `Uncaught error - ${status}`,
                        code: 1,
                    }

                    return Promise.reject(new Error(errorObject.message))
                }

                return Promise.reject(error.response && error.response.data)
            },
        )

        return this.instance
    }
}

export default new Api()
