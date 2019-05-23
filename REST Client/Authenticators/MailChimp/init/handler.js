function() {

        var username = "anystring";
        var password = this.props["api_key"];

        this.setOutputReference("Basic Auth", execRef);

        function basicAuthHeaderValue() {
            var credentials = username + ":" + password;
            var Base64 = Java.type("java.util.Base64");

            return Base64.getEncoder().encodeToString(credentials.getBytes());
        }

        function execRef() {
               return basicAuthHeaderValue();
        }
}