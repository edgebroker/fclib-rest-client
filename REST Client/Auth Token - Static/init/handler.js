function handler(In) {
    var token = this.props["token"];
    this.setOutputReference("Auth Token", execRef);
    function execRef() {
           return token;
    }
}