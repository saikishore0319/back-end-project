class ApiResponse{
    constructor(statusCode, response, data){
        this.statusCode = statusCode;
        this.response = response;
        this.data = data;
        this.success = statusCode < 400
    }
}