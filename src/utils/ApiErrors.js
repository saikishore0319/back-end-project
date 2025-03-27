/* The `ApiError` class is a custom error class in JavaScript that includes status code, message, stack
trace, and errors. */
class ApiError extends Error{
    constructor(
        statusCode,
        message ="Something went wrong",
        stack= "",
        errors= []
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors
        if(stack){
            this.stack = stack  
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}