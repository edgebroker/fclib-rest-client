function handler() {
    var token = this.props["token"];
    this.setOutputReference("Authenticator", execRef);
    function execRef() {
        return {
            "Authorization": "Bearer " + token
        };
    }
}   