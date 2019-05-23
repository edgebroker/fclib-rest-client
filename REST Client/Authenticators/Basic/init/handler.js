function() {

        var username = this.props["username"];
        var password = this.props["password"];

        this.setOutputReference("Authenticator", execRef);

        function basicAuthHeaderValue() {
            var credentials = username + ":" + password;
            var Base64 = Java.type("java.util.Base64");

            return Base64.getEncoder().encodeToString(credentials.getBytes());
        }

        function execRef() {
               return {
                    "Authorization": "Basic " + basicAuthHeaderValue()
               };
        }
}